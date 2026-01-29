/**
 * HOS COMPLIANCE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Clock, AlertTriangle, CheckCircle, User, Search,
  TrendingUp, TrendingDown, Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HOSCompliance() {
  const [search, setSearch] = useState("");

  const driversQuery = trpc.compliance.getHOSDrivers.useQuery({ search });
  const statsQuery = trpc.compliance.getHOSStats.useQuery();
  const violationsQuery = trpc.compliance.getRecentHOSViolations.useQuery({ limit: 10 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Compliant</Badge>;
      case "warning": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case "violation": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Violation</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            HOS Compliance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hours of Service per 49 CFR 395</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.compliant || 0}</p>
                )}
                <p className="text-xs text-slate-400">Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.warnings || 0}</p>
                )}
                <p className="text-xs text-slate-400">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>
                )}
                <p className="text-xs text-slate-400">Violations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Timer className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.complianceRate}%</p>
                )}
                <p className="text-xs text-slate-400">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations */}
      {(violationsQuery.data?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Recent Violations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-500/20">
              {violationsQuery.data?.slice(0, 5).map((violation: any) => (
                <div key={violation.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Clock className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{violation.driverName}</p>
                      <p className="text-sm text-slate-400">{violation.violationType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-400">{violation.duration}</p>
                    <p className="text-xs text-slate-500">{violation.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Drivers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Driver HOS Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : driversQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {driversQuery.data?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.status === "violation" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">
                        {driver.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getStatusBadge(driver.status)}
                        </div>
                        <p className="text-xs text-slate-500">Current: {driver.currentDutyStatus}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.trend === "up" ? <TrendingUp className="w-4 h-4 text-red-400" /> : driver.trend === "down" ? <TrendingDown className="w-4 h-4 text-green-400" /> : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">Driving Today</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{driver.drivingToday}h</span>
                        <span className="text-xs text-slate-500">/ 11h</span>
                      </div>
                      <Progress value={(driver.drivingToday / 11) * 100} className="h-1 mt-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">On-Duty Today</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{driver.onDutyToday}h</span>
                        <span className="text-xs text-slate-500">/ 14h</span>
                      </div>
                      <Progress value={(driver.onDutyToday / 14) * 100} className="h-1 mt-1" />
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">70hr Cycle</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{driver.cycleUsed}h</span>
                        <span className="text-xs text-slate-500">/ 70h</span>
                      </div>
                      <Progress value={(driver.cycleUsed / 70) * 100} className="h-1 mt-1" />
                    </div>
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
