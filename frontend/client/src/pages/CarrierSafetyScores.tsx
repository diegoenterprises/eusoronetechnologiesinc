/**
 * CARRIER SAFETY SCORES PAGE
 * 100% Dynamic - View and manage carrier safety ratings
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Truck, FileText, RefreshCw, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierSafetyScores() {
  const scoresQuery = trpc.carriers.getCSAScores.useQuery({});
  const basicsQuery = trpc.carriers.getCSAScores.useQuery({});
  const trendQuery = trpc.carriers.getCSAScores.useQuery({});

  const scores = scoresQuery.data as any;
  const basics = (basicsQuery.data as any) || [];
  const trend = (trendQuery.data as any) || [];

  const getScoreColor = (score: number, threshold: number) => {
    if (score >= threshold) return "text-red-400";
    if (score >= threshold * 0.7) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "satisfactory": return "bg-green-500/20 text-green-400";
      case "conditional": return "bg-yellow-500/20 text-yellow-400";
      case "unsatisfactory": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Safety Scores
          </h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA safety ratings and CSA scores</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            scoresQuery.refetch();
            basicsQuery.refetch();
          }}
          className="bg-slate-800/50 border-slate-700/50 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", (scoresQuery.isFetching || basicsQuery.isFetching) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overall Rating */}
      {scoresQuery.isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <Card className={cn(
          "rounded-xl border",
          scores?.status === "satisfactory" ? "bg-green-500/10 border-green-500/30" :
          scores?.status === "conditional" ? "bg-yellow-500/10 border-yellow-500/30" :
          "bg-red-500/10 border-red-500/30"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  scores?.status === "satisfactory" ? "bg-green-500/20" :
                  scores?.status === "conditional" ? "bg-yellow-500/20" : "bg-red-500/20"
                )}>
                  <Shield className={cn(
                    "w-8 h-8",
                    scores?.status === "satisfactory" ? "text-green-400" :
                    scores?.status === "conditional" ? "text-yellow-400" : "text-red-400"
                  )} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">FMCSA Safety Rating</p>
                  <p className={cn(
                    "text-3xl font-bold capitalize",
                    scores?.status === "satisfactory" ? "text-green-400" :
                    scores?.status === "conditional" ? "text-yellow-400" : "text-red-400"
                  )}>
                    {scores?.status || "Not Rated"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">DOT Number</p>
                  <p className="text-white font-bold text-xl">{scores?.dotNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm">MC Number</p>
                  <p className="text-white font-bold text-xl">{scores?.mcNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Last Update</p>
                  <p className="text-white font-bold">{scores?.lastUpdate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BASIC Scores */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            CSA BASIC Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {basicsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {basics.map((basic: any) => (
                <div key={basic.id} className={cn(
                  "p-4 rounded-lg border",
                  basic.score >= basic.threshold ? "bg-red-500/10 border-red-500/30" :
                  basic.score >= basic.threshold * 0.7 ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-slate-700/30 border-slate-600/30"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-white font-medium">{basic.name}</p>
                    {basic.score >= basic.threshold && (
                      <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />Alert
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-end justify-between mb-2">
                    <p className={cn(
                      "text-3xl font-bold",
                      getScoreColor(basic.score, basic.threshold)
                    )}>
                      {basic.score}%
                    </p>
                    <p className="text-slate-500 text-sm">Threshold: {basic.threshold}%</p>
                  </div>

                  <Progress
                    value={basic.score}
                    className={cn(
                      "h-2",
                      basic.score >= basic.threshold && "[&>div]:bg-red-500",
                      basic.score >= basic.threshold * 0.7 && basic.score < basic.threshold && "[&>div]:bg-yellow-500"
                    )}
                  />

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-500 text-xs">{basic.inspections} inspections</span>
                    <div className="flex items-center gap-1">
                      {basic.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 text-red-400" />
                      ) : basic.trend === "down" ? (
                        <TrendingDown className="w-3 h-3 text-green-400" />
                      ) : null}
                      <span className={cn(
                        "text-xs",
                        basic.trend === "up" ? "text-red-400" :
                        basic.trend === "down" ? "text-green-400" : "text-slate-500"
                      )}>
                        {basic.trendValue}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-medium">Inspections (24 mo)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Driver</p>
                <p className="text-white text-xl font-bold">{scores?.driverInspections || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Vehicle</p>
                <p className="text-white text-xl font-bold">{scores?.vehicleInspections || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Violations (24 mo)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Driver</p>
                <p className="text-yellow-400 text-xl font-bold">{scores?.driverViolations || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Vehicle</p>
                <p className="text-yellow-400 text-xl font-bold">{scores?.vehicleViolations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-red-400" />
              <span className="text-white font-medium">Crashes (24 mo)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-slate-400 text-xs">Fatal</p>
                <p className="text-red-400 text-xl font-bold">{scores?.fatalCrashes || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Injury</p>
                <p className="text-orange-400 text-xl font-bold">{scores?.injuryCrashes || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tow</p>
                <p className="text-yellow-400 text-xl font-bold">{scores?.towCrashes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-cyan-400 mb-1">About CSA Scores</p>
            <p>CSA BASIC percentiles range from 0-100. Higher percentiles indicate worse performance compared to peers. 
            Scores at or above the intervention threshold may trigger FMCSA enforcement actions. 
            Maintain scores below thresholds to avoid interventions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
