/**
 * ESCORT PROFILE PAGE
 * Comprehensive escort profile — Jony Ive-inspired minimalism, safety-first.
 * 
 * Sections:
 * 1. Identity Card — Photo, name, verification, status, stats
 * 2. Availability Status System — Live status with schedule
 * 3. Position Capabilities — Lead, Rear, Height Pole, Route Survey
 * 4. State Certifications Matrix — Active, expiring, pending
 * 5. Vehicle & Equipment Card — Vehicle details + equipment checklist
 * 6. Convoy History & Statistics — Performance metrics
 * 7. Reviews & Ratings — Category breakdown
 * 8. EusoWallet Integration — Balance + earnings
 * 
 * Powered by: escorts.getProfile, escorts.updateProfile, escorts.getAvailability
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, Shield, Star, Calendar, MapPin, Clock,
  CheckCircle, Award, FileCheck, Users, DollarSign,
  Navigation, AlertTriangle, Wallet, Settings,
  ChevronRight, User, Phone, Mail, Building2,
  Ruler, Radio, Wrench, Eye, ShieldCheck,
  Zap, Target, Trophy, Medal, TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY STATUS COLORS
// ═══════════════════════════════════════════════════════════════

const AVAILABILITY_STATES = [
  { value: "available", label: "Available Now", color: "bg-emerald-500", textColor: "text-emerald-400", ring: "ring-emerald-500/30" },
  { value: "available_soon", label: "Available Soon", color: "bg-amber-500", textColor: "text-amber-400", ring: "ring-amber-500/30" },
  { value: "on_convoy", label: "On Convoy", color: "bg-blue-500", textColor: "text-blue-400", ring: "ring-blue-500/30" },
  { value: "en_route", label: "En Route to Job", color: "bg-purple-500", textColor: "text-purple-400", ring: "ring-purple-500/30" },
  { value: "off_duty", label: "Off Duty", color: "bg-slate-500", textColor: "text-slate-400", ring: "ring-slate-500/30" },
  { value: "unavailable", label: "Unavailable", color: "bg-red-500", textColor: "text-red-400", ring: "ring-red-500/30" },
];

// ═══════════════════════════════════════════════════════════════
// ESCORT-SPECIFIC RANKS (The Haul)
// ═══════════════════════════════════════════════════════════════

function getRankForConvoys(totalConvoys: number): { rank: string; level: number; nextRankAt: number } {
  if (totalConvoys >= 2500) return { rank: "Legend of the Lane", level: 30, nextRankAt: 999999 };
  if (totalConvoys >= 1000) return { rank: "Route Master", level: 25, nextRankAt: 2500 };
  if (totalConvoys >= 500) return { rank: "Convoy Commander", level: 20, nextRankAt: 1000 };
  if (totalConvoys >= 100) return { rank: "Convoy Guardian", level: 15, nextRankAt: 500 };
  if (totalConvoys >= 25) return { rank: "Road Scout", level: 10, nextRankAt: 100 };
  return { rank: "Convoy Rookie", level: 5, nextRankAt: 25 };
}

// ═══════════════════════════════════════════════════════════════
// RATING BAR COMPONENT
// ═══════════════════════════════════════════════════════════════

function RatingBar({ label, value, maxValue = 5 }: { label: string; value: number; maxValue?: number }) {
  const pct = Math.min(100, (value / maxValue) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white font-medium w-8 text-right tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function EscortProfile() {
  const profileQuery = (trpc as any).escorts.getProfile.useQuery(undefined, { staleTime: 30000 });
  const availabilityQuery = (trpc as any).escorts.getAvailability.useQuery();
  const earningsQuery = (trpc as any).escorts.getEarningsStats.useQuery();
  const jobsSummaryQuery = (trpc as any).escorts.getJobsSummary.useQuery();
  const completedJobsQuery = (trpc as any).escorts.getCompletedJobs.useQuery({ limit: 5 });
  const updateAvailability = (trpc as any).escorts.updateAvailability.useMutation({
    onSuccess: () => { toast.success("Availability updated"); availabilityQuery.refetch(); },
    onError: (e: any) => toast.error("Failed to update", { description: e.message }),
  });

  const [activeTab, setActiveTab] = useState<"overview" | "certifications" | "vehicle" | "history">("overview");

  const profile = profileQuery.data;
  const availability = availabilityQuery.data;
  const earnings = earningsQuery.data;
  const jobsSummary = jobsSummaryQuery.data;
  const completedJobs = completedJobsQuery.data;

  if (profileQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-6 rounded-full bg-slate-800/50 mb-6"><User className="w-12 h-12 text-slate-500" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-slate-400 text-center max-w-md">Unable to load your escort profile. Please try again.</p>
        </div>
      </div>
    );
  }

  const rankInfo = getRankForConvoys(profile.stats?.totalConvoys || 0);
  const rankProgress = profile.stats?.totalConvoys ? Math.min(100, (profile.stats.totalConvoys / rankInfo.nextRankAt) * 100) : 0;
  const isVerified = profile.verificationStatus === "approved" || profile.verificationStatus === "verified";
  const memberSince = profile.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear();

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "certifications" as const, label: "Certifications" },
    { id: "vehicle" as const, label: "Vehicle" },
    { id: "history" as const, label: "History" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. IDENTITY CARD — Above the fold                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile photo + live indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center overflow-hidden">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white/80" />
                )}
              </div>
              {/* Status dot — reflects verification, not always green */}
              {isVerified ? (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-500 border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/50" />
                </div>
              )}
            </div>

            {/* Name + role + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{profile.name || "Escort"}</h1>
                {isVerified && (
                  <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-xs"><ShieldCheck className="w-3 h-3 mr-1" />VERIFIED</Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                {profile.preferredPosition === "lead" ? "Lead Escort" : profile.preferredPosition === "chase" ? "Rear Escort" : profile.preferredPosition === "both" ? "Lead & Rear Escort" : "Escort"}
                {profile.positions?.heightPole && " / Height Pole Certified"}
              </p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {profile.rating?.totalReviews > 0 && (
                  <span className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-white font-medium">{profile.rating.overall.toFixed(1)}</span><span className="text-slate-500">({profile.rating.totalReviews})</span></span>
                )}
                {profile.stateCertifications?.length > 0 && (
                  <span className="text-sm text-slate-400">{profile.stateCertifications.length} States</span>
                )}
                <span className="text-sm text-slate-400">Since {memberSince}</span>
              </div>
            </div>

            {/* Rank badge */}
            <div className="flex-shrink-0 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <p className="text-amber-300 text-xs font-bold">{rankInfo.rank}</p>
                <p className="text-[10px] text-slate-500">Level {rankInfo.level}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-white tabular-nums">{(profile.stats?.totalConvoys || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Convoys</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white tabular-nums">{profile.stats?.onTimePercentage || 0}%</p>
              <p className="text-[10px] text-slate-500 mt-0.5">On-Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white tabular-nums">{profile.stats?.totalMiles ? (profile.stats.totalMiles > 999999 ? `${(profile.stats.totalMiles / 1000000).toFixed(1)}M` : profile.stats.totalMiles > 999 ? `${(profile.stats.totalMiles / 1000).toFixed(0)}K` : profile.stats.totalMiles) : "0"}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Miles</p>
            </div>
            <div className="text-center">
              <p className={cn("text-2xl font-bold tabular-nums", profile.stats?.incidentCount === 0 ? "text-emerald-400" : "text-white")}>{profile.stats?.incidentCount || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Incidents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all", activeTab === tab.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700/50")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 2. AVAILABILITY STATUS */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weekly schedule */}
              {availability && (
                <div className="grid grid-cols-7 gap-1.5">
                  {(availability as any[]).map((day: any) => (
                    <button
                      key={day.dayOfWeek}
                      onClick={() => updateAvailability.mutate({ dayOfWeek: day.dayOfWeek, available: !day.available })}
                      className={cn(
                        "rounded-lg py-2 px-1 text-center transition-all border",
                        day.available
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                      )}
                    >
                      <p className="text-[10px] font-medium">{day.dayName?.slice(0, 3)}</p>
                      <p className="text-[10px] mt-0.5">{day.available ? "ON" : "OFF"}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Contact info */}
              <div className="space-y-2 pt-2">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{profile.email}</span>
                  </div>
                )}
                {profile.homeBase?.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{profile.homeBase.city}, {profile.homeBase.state}</span>
                  </div>
                )}
                {profile.willingToTravel > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">Will travel up to {profile.willingToTravel} miles</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. POSITION CAPABILITIES */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />Escort Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {/* Lead Escort */}
                <div className={cn("rounded-xl p-4 border transition-all", profile.positions?.leadEscort ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-800/50 border-slate-700/50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium text-sm">Lead Escort</span>
                  </div>
                  {profile.positions?.leadEscort ? (
                    <>
                      <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                      <p className="text-slate-400 text-xs mt-2">{profile.stats?.leadJobs || 0} jobs</p>
                    </>
                  ) : (
                    <Badge className="border-0 bg-slate-700/50 text-slate-500 text-[10px]">Not Certified</Badge>
                  )}
                </div>

                {/* Rear Escort */}
                <div className={cn("rounded-xl p-4 border transition-all", profile.positions?.rearEscort ? "bg-purple-500/10 border-purple-500/30" : "bg-slate-800/50 border-slate-700/50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium text-sm">Rear Escort</span>
                  </div>
                  {profile.positions?.rearEscort ? (
                    <>
                      <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                      <p className="text-slate-400 text-xs mt-2">{profile.stats?.chaseJobs || 0} jobs</p>
                    </>
                  ) : (
                    <Badge className="border-0 bg-slate-700/50 text-slate-500 text-[10px]">Not Certified</Badge>
                  )}
                </div>

                {/* Height Pole */}
                <div className={cn("rounded-xl p-4 border transition-all", profile.positions?.heightPole ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800/50 border-slate-700/50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-medium text-sm">Height Pole</span>
                  </div>
                  {profile.positions?.heightPole ? (
                    <>
                      <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                      {profile.heightPole?.maxHeight && <p className="text-amber-300 text-xs mt-2">Max: {profile.heightPole.maxHeight} ft</p>}
                    </>
                  ) : (
                    <Badge className="border-0 bg-slate-700/50 text-slate-500 text-[10px]">Not Certified</Badge>
                  )}
                </div>

                {/* Route Survey */}
                <div className={cn("rounded-xl p-4 border transition-all", profile.positions?.routeSurvey ? "bg-cyan-500/10 border-cyan-500/30" : "bg-slate-800/50 border-slate-700/50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium text-sm">Route Survey</span>
                  </div>
                  {profile.positions?.routeSurvey ? (
                    <Badge className="border-0 bg-emerald-500/20 text-emerald-400 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                  ) : (
                    <Badge className="border-0 bg-slate-700/50 text-slate-500 text-[10px]">Not Certified</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">Preferred Position: <span className="text-white font-medium capitalize">{profile.preferredPosition === "lead" ? "Lead Escort" : profile.preferredPosition === "chase" ? "Rear Escort" : profile.preferredPosition || "Lead Escort"}</span></p>
              </div>
            </CardContent>
          </Card>

          {/* RATINGS & REVIEWS */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />Ratings
                {profile.rating?.totalReviews > 0 && <span className="text-sm text-slate-500 font-normal ml-1">({profile.rating.totalReviews} reviews)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Overall rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white tabular-nums">{profile.rating?.overall ? profile.rating.overall.toFixed(1) : "—"}</p>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(profile.rating?.overall || 0) ? "text-amber-400 fill-amber-400" : "text-slate-600")} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="space-y-2.5">
                <RatingBar label="Communication" value={profile.rating?.communication || 0} />
                <RatingBar label="Punctuality" value={profile.rating?.punctuality || 0} />
                <RatingBar label="Professionalism" value={profile.rating?.professionalism || 0} />
                <RatingBar label="Safety Awareness" value={profile.rating?.safetyAwareness || 0} />
                <RatingBar label="Route Knowledge" value={profile.rating?.routeKnowledge || 0} />
              </div>
            </CardContent>
          </Card>

          {/* EUSOWALLET + EARNINGS */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />EusoWallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lifetime earnings */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <p className="text-xs text-slate-400">Lifetime Earnings</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tabular-nums">
                  ${(profile.wallet?.lifetimeEarnings || 0).toLocaleString()}
                </p>
              </div>

              {/* Earnings breakdown */}
              {earnings && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-[10px] text-slate-500">This Week</p>
                    <p className="text-white font-bold text-sm tabular-nums">${(earnings.thisWeek || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-[10px] text-slate-500">This Month</p>
                    <p className="text-white font-bold text-sm tabular-nums">${(earnings.thisMonth || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-[10px] text-slate-500">Avg/Job</p>
                    <p className="text-white font-bold text-sm tabular-nums">${(earnings.avgPerJob || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Job summary */}
              {jobsSummary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[10px] text-blue-400">Active Jobs</p>
                    <p className="text-white font-bold">{jobsSummary.inProgress || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-400">Completed</p>
                    <p className="text-white font-bold">{jobsSummary.completed || 0}</p>
                  </div>
                </div>
              )}

              <Button className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-lg text-sm" onClick={() => window.location.href = "/wallet"}>
                <Wallet className="w-4 h-4 mr-2" />Open EusoWallet
              </Button>
            </CardContent>
          </Card>

          {/* THE HAUL — Gamification */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />The Haul — {rankInfo.rank}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Rank info */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Medal className="w-10 h-10 text-amber-400" />
                  </div>
                  <p className="text-amber-300 text-xs font-bold mt-2">{rankInfo.rank}</p>
                  <p className="text-[10px] text-slate-500">Level {rankInfo.level}</p>
                </div>

                {/* Progress */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{(profile.stats?.totalConvoys || 0).toLocaleString()} convoys</span>
                    <span className="text-sm text-slate-400">{rankInfo.nextRankAt < 999999 ? `${rankInfo.nextRankAt.toLocaleString()} to next rank` : "MAX RANK"}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-700/50 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700" style={{ width: `${rankProgress}%` }} />
                  </div>

                  {/* Quick achievements */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {profile.stats?.totalConvoys >= 1 && <Badge className="border-0 bg-slate-700/50 text-slate-300 text-[10px]"><Zap className="w-3 h-3 mr-1 text-amber-400" />First Convoy</Badge>}
                    {profile.stats?.incidentCount === 0 && profile.stats?.totalConvoys >= 10 && <Badge className="border-0 bg-emerald-500/10 text-emerald-400 text-[10px]"><Shield className="w-3 h-3 mr-1" />Zero Incidents</Badge>}
                    {(profile.stateCertifications?.length || 0) >= 5 && <Badge className="border-0 bg-blue-500/10 text-blue-400 text-[10px]"><Award className="w-3 h-3 mr-1" />Multi-State Pro</Badge>}
                    {profile.stats?.totalConvoys >= 100 && <Badge className="border-0 bg-purple-500/10 text-purple-400 text-[10px]"><Target className="w-3 h-3 mr-1" />Centurion</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: CERTIFICATIONS                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "certifications" && (
        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />State Certifications
                </CardTitle>
                <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-lg text-xs" onClick={() => window.location.href = "/escort/certifications"}>
                  <ChevronRight className="w-3 h-3 mr-1" />Add State
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profile.stateCertifications && profile.stateCertifications.length > 0 ? (
                <div className="space-y-4">
                  {/* Active certs grid */}
                  <div>
                    <p className="text-sm text-slate-400 mb-3">Active ({profile.stateCertifications.filter((c: any) => c.verificationStatus === "verified").length})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {profile.stateCertifications.map((cert: any, i: number) => {
                        const isExpiring = cert.expirationDate && new Date(cert.expirationDate) < new Date(Date.now() + 90 * 86400000);
                        const isExpired = cert.expirationDate && new Date(cert.expirationDate) < new Date();
                        return (
                          <div key={i} className={cn("rounded-xl p-3 text-center border transition-all",
                            isExpired ? "bg-red-500/10 border-red-500/30" :
                            isExpiring ? "bg-amber-500/10 border-amber-500/30" :
                            "bg-emerald-500/10 border-emerald-500/30"
                          )}>
                            <p className="text-white font-bold text-lg">{cert.state}</p>
                            <p className={cn("text-[10px] mt-0.5",
                              isExpired ? "text-red-400" : isExpiring ? "text-amber-400" : "text-emerald-400"
                            )}>
                              {isExpired ? "EXPIRED" : cert.expirationDate ? new Date(cert.expirationDate).getFullYear() : "Active"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expiring soon */}
                  {profile.stateCertifications.some((c: any) => {
                    const exp = c.expirationDate ? new Date(c.expirationDate) : null;
                    return exp && exp > new Date() && exp < new Date(Date.now() + 90 * 86400000);
                  }) && (
                    <div>
                      <p className="text-sm text-amber-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Expiring Soon</p>
                      {profile.stateCertifications.filter((c: any) => {
                        const exp = c.expirationDate ? new Date(c.expirationDate) : null;
                        return exp && exp > new Date() && exp < new Date(Date.now() + 90 * 86400000);
                      }).map((cert: any, i: number) => {
                        const daysLeft = Math.ceil((new Date(cert.expirationDate).getTime() - Date.now()) / 86400000);
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-2">
                            <div>
                              <span className="text-white font-medium">{cert.state}</span>
                              <span className="text-amber-400 text-xs ml-2">Expires in {daysLeft} days</span>
                            </div>
                            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 rounded-lg text-xs" onClick={() => window.location.href = "/escort/certifications"}>Renew</Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No certifications uploaded yet.</p>
                  <p className="text-slate-500 text-sm mt-1">Add your state pilot car certifications to unlock more jobs.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permits */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />Permits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Manage oversize/overweight escort permits by state.</p>
                <Button size="sm" className="mt-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-xs" onClick={() => window.location.href = "/escort/permits"}>
                  <ChevronRight className="w-3 h-3 mr-1" />Manage Permits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: VEHICLE & EQUIPMENT                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "vehicle" && (
        <div className="space-y-6">
          {/* Vehicle Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />Escort Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.vehicle ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Car className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{profile.vehicle.year} {profile.vehicle.make} {profile.vehicle.model}</p>
                      <p className="text-slate-400 text-sm">{profile.vehicle.color} / {profile.vehicle.licenseState} {profile.vehicle.licensePlate}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No vehicle registered.</p>
                  <p className="text-slate-500 text-sm mt-1">Add your escort vehicle details to accept jobs.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Checklist */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />Required Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.equipment ? (
                <div className="space-y-4">
                  {/* Signage */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Signage</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "oversizeFront", label: "Oversize Front" },
                        { key: "oversizeRear", label: "Oversize Rear" },
                        { key: "wideLoad", label: "Wide Load" },
                        { key: "longLoad", label: "Long Load" },
                      ].map((item) => (
                        <div key={item.key} className={cn("rounded-lg p-2 flex items-center gap-2 border",
                          profile.equipment.signage?.[item.key] ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800/50 border-slate-700/50"
                        )}>
                          <CheckCircle className={cn("w-4 h-4", profile.equipment.signage?.[item.key] ? "text-emerald-400" : "text-slate-600")} />
                          <span className="text-xs text-slate-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety Equipment */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Safety Equipment</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "amberStrobes", label: "Amber Strobes (360)" },
                        { key: "flags", label: "Flags (18\" x4)" },
                        { key: "fireExtinguisher", label: "Fire Extinguisher" },
                        { key: "firstAidKit", label: "First Aid Kit" },
                        { key: "reflectiveVest", label: "Reflective Vest" },
                        { key: "flashlight", label: "Flashlight (1000+ lm)" },
                      ].map((item) => (
                        <div key={item.key} className={cn("rounded-lg p-2 flex items-center gap-2 border",
                          profile.equipment.safety?.[item.key] ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800/50 border-slate-700/50"
                        )}>
                          <CheckCircle className={cn("w-4 h-4", profile.equipment.safety?.[item.key] ? "text-emerald-400" : "text-slate-600")} />
                          <span className="text-xs text-slate-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Communication */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Communication</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "cbRadio", label: "CB Radio (40-ch)" },
                        { key: "commercialRadio", label: "Commercial Radio" },
                        { key: "cellPhone", label: "Cell Phone" },
                      ].map((item) => (
                        <div key={item.key} className={cn("rounded-lg p-2 flex items-center gap-2 border",
                          profile.equipment.communication?.[item.key] ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800/50 border-slate-700/50"
                        )}>
                          <CheckCircle className={cn("w-4 h-4", profile.equipment.communication?.[item.key] ? "text-emerald-400" : "text-slate-600")} />
                          <span className="text-xs text-slate-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No equipment verification on file.</p>
                  <p className="text-slate-500 text-sm mt-1">Complete your equipment checklist to accept escort jobs.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />Insurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Manage escort vehicle insurance & liability coverage.</p>
                <Button size="sm" className="mt-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg text-xs" onClick={() => window.location.href = "/insurance"}>
                  <ChevronRight className="w-3 h-3 mr-1" />Manage Insurance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: CONVOY HISTORY                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Performance stats */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />Convoy Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">{(profile.stats?.totalConvoys || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Convoys</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">{profile.stats?.onTimePercentage || 0}%</p>
                  <p className="text-xs text-slate-500 mt-1">On-Time</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">{profile.stats?.leadJobs || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Lead Jobs</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-2xl font-bold text-white tabular-nums">{profile.stats?.chaseJobs || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Rear Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent convoys */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />Recent Convoys
                </CardTitle>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs" onClick={() => window.location.href = "/escort/jobs"}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {completedJobs && completedJobs.length > 0 ? (
                <div className="space-y-2">
                  {completedJobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/20 border border-slate-700/30 hover:bg-slate-700/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-500/10 flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{job.loadNumber || `Job #${job.id}`}</p>
                          <p className="text-slate-500 text-xs truncate">{job.route || `${job.origin} → ${job.destination}`}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-emerald-400 font-bold text-sm tabular-nums">${(job.rate || job.earnings || 0).toLocaleString()}</p>
                        <p className="text-slate-500 text-[10px]">{job.completedAt || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No completed convoys yet.</p>
                  <p className="text-slate-500 text-sm mt-1">Your completed escort jobs will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
