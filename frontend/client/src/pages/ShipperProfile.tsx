/**
 * SHIPPER PROFILE PAGE
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
  Building2, Package, DollarSign, TrendingUp, Clock,
  MapPin, Phone, Mail, Globe, Edit, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperProfile() {
  const profileQuery = trpc.shippers.getProfile.useQuery();
  const statsQuery = trpc.shippers.getStats.useQuery();
  const recentLoadsQuery = trpc.shippers.getRecentLoads.useQuery({ limit: 5 });

  const profile = profileQuery.data;
  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Shipper Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your company information and stats</p>
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
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{profile?.companyName}</h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="bg-green-500/20 text-green-400 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />Verified
                  </Badge>
                </div>

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
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{profile?.website}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
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
                      <p className="text-2xl font-bold text-blue-400">{stats?.totalLoads || 0}</p>
                    )}
                    <p className="text-xs text-slate-400">Total Loads</p>
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
                      <p className="text-2xl font-bold text-emerald-400">${stats?.totalSpend?.toLocaleString()}</p>
                    )}
                    <p className="text-xs text-slate-400">Total Spend</p>
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
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold text-purple-400">${stats?.avgRatePerMile?.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-slate-400">Avg Rate/Mile</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Volume */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Monthly Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  {stats?.monthlyVolume?.map((month: any) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <span className="text-slate-400 w-16 text-sm">{month.month}</span>
                      <div className="flex-1">
                        <Progress value={(month.loads / stats.maxMonthlyLoads) * 100} className="h-2" />
                      </div>
                      <span className="text-white font-medium w-12 text-right">{month.loads}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Loads */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Recent Loads</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentLoadsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : recentLoadsQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No recent loads</p>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {recentLoadsQuery.data?.map((load: any) => (
                    <div key={load.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.origin} → {load.destination}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-medium">${load.rate?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{load.date}</p>
                        </div>
                      </div>
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
