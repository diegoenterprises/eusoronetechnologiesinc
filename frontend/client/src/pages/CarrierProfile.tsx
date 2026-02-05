/**
 * CARRIER PROFILE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Package, DollarSign, TrendingUp, Shield, Users,
  MapPin, Phone, Mail, Edit, CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierProfile() {
  const profileQuery = (trpc as any).carriers.getProfile.useQuery();
  const statsQuery = (trpc as any).carriers.getStats.useQuery();
  const fleetQuery = (trpc as any).carriers.getFleetSummary.useQuery();
  const safetyQuery = (trpc as any).carriers.getSafetyRating.useQuery();

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const fleet = fleetQuery.data;
  const safety = safetyQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Carrier Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your company information and fleet stats</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Edit className="w-4 h-4 mr-2" />Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-6">
            {profileQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-6 w-48 mx-auto" />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{profile?.companyName}</h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />SAFER Verified
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-4">MC#{profile?.mcNumber} • DOT#{profile?.dotNumber}</p>

                <div className="space-y-3 text-left mt-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{profile?.address}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{profile?.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{profile?.email}</span>
                  </div>
                </div>

                {/* Insurance */}
                <div className="mt-6 p-4 rounded-xl bg-slate-700/30">
                  <p className="text-sm text-slate-400 mb-2">Insurance Coverage</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Liability</span>
                      <span className="text-white">${profile?.liabilityInsurance?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cargo</span>
                      <span className="text-white">${profile?.cargoInsurance?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Fleet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-blue-400">{stats?.loadsCompleted || 0}</p>
                    )}
                    <p className="text-xs text-slate-400">Loads Completed</p>
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
                    {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                      <p className="text-2xl font-bold text-emerald-400">${stats?.totalRevenue?.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-slate-400">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-green-400">{stats?.onTimeRate}%</p>
                    )}
                    <p className="text-xs text-slate-400">On-Time Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    {safetyQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-purple-400">{safety?.overallScore}</p>
                    )}
                    <p className="text-xs text-slate-400">Safety Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fleet Summary */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Fleet Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fleetQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-3xl font-bold text-white">{fleet?.totalTrucks}</p>
                    <p className="text-xs text-slate-400">Total Trucks</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-3xl font-bold text-green-400">{fleet?.activeTrucks}</p>
                    <p className="text-xs text-slate-400">Active</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{fleet?.totalDrivers}</p>
                    <p className="text-xs text-slate-400">Drivers</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                    <p className="text-3xl font-bold text-purple-400">{fleet?.utilization}%</p>
                    <p className="text-xs text-slate-400">Utilization</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety Rating */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                FMCSA Safety Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safetyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  {safety?.basicScores?.map((basic: any) => (
                    <div key={basic.name} className="flex items-center gap-4">
                      <span className="text-slate-400 w-32 text-sm">{basic.name}</span>
                      <div className="flex-1">
                        <Progress value={basic.score} className={cn("h-2", basic.score > basic.threshold && "[&>div]:bg-red-500")} />
                      </div>
                      <span className={cn("font-medium w-12 text-right", basic.score > basic.threshold ? "text-red-400" : "text-green-400")}>{basic.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
