/**
 * FLEET INSURANCE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, DollarSign, Truck, Calendar, CheckCircle,
  AlertTriangle, FileText, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FleetInsurance() {
  const policiesQuery = trpc.insurance.getPolicies.useQuery();
  const coverageQuery = trpc.insurance.getCoverage.useQuery();
  const claimsQuery = trpc.insurance.getClaimsSummary.useQuery();
  const vehiclesQuery = trpc.insurance.getInsuredVehicles.useQuery({ limit: 10 });

  const coverage = coverageQuery.data && !Array.isArray(coverageQuery.data) ? coverageQuery.data : null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Fleet Insurance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage fleet insurance policies and coverage</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <FileText className="w-4 h-4 mr-2" />View All Policies
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {coverageQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${coverage?.totalCoverage?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {coverageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{coverage?.insuredVehicles || 0}</p>
                )}
                <p className="text-xs text-slate-400">Insured Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {coverageQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${coverage?.annualPremium?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Annual Premium</p>
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
                {claimsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(claimsQuery.data as any)?.openClaims || (claimsQuery.data as any)?.open || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open Claims</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Policies */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Active Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {policiesQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : policiesQuery.data?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No active policies</p>
          ) : (
            <div className="space-y-4">
              {policiesQuery.data?.map((policy: any) => (
                <div key={policy.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{policy.type}</p>
                        <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                      </div>
                      <p className="text-sm text-slate-400">Policy: {policy.policyNumber}</p>
                      <p className="text-sm text-slate-400">Provider: {policy.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">${policy.coverageLimit?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Coverage Limit</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires: {policy.expirationDate}</span>
                      <span>Deductible: ${policy.deductible?.toLocaleString()}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                      <Download className="w-4 h-4 mr-1" />Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Coverage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {coverageQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="space-y-4">
                {coverage?.breakdown?.map((item: any) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.type}</span>
                      <span className="text-emerald-400 font-bold">${item.limit?.toLocaleString()}</span>
                    </div>
                    <Progress value={(item.limit / coverage.totalCoverage) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insured Vehicles */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Insured Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {vehiclesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {vehiclesQuery.data?.map((vehicle: any) => (
                  <div key={vehicle.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{vehicle.unitNumber}</p>
                      <p className="text-xs text-slate-500">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(vehicle.status === "covered" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>{vehicle.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
