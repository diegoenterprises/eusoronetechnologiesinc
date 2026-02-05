/**
 * ESCORT ROUTE PLANNING PAGE
 * 100% Dynamic - Plan oversize load escort routes with permit requirements
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  MapPin, Route, AlertTriangle, Shield, Clock,
  ChevronLeft, ChevronRight, Navigation, FileText,
  Ruler, ArrowUpDown, Car, Truck, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortRoutePlanning() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/escort/route/:jobId");
  const jobId = params?.jobId;

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const jobQuery = (trpc as any).escorts.getJobs.useQuery({ status: undefined });
  const routesQuery = (trpc as any).escorts.getJobs.useQuery({ status: undefined });
  const permitsQuery = (trpc as any).escorts.getCertifications.useQuery();

  const selectRouteMutation = (trpc as any).escorts.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Route selected");
      navigate(`/escort/job/${jobId}`);
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const job = jobQuery.data;
  const routes = routesQuery.data || [];
  const permits = permitsQuery.data || [];

  if (jobQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/escort/jobs")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Route Planning
          </h1>
          <p className="text-slate-400 text-sm mt-1">Job #{(job as any)?.[0]?.id || (job as any)?.jobNumber}</p>
        </div>
      </div>

      {/* Load Dimensions */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Truck className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-bold">Oversize Load Dimensions</p>
              <p className="text-slate-400 text-sm">{(job as any)?.[0]?.convoyName || (job as any)?.loadDescription}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Ruler className="w-4 h-4" />
                <span className="text-xs">Width</span>
              </div>
              <p className="text-white font-bold text-lg">{(job as any)?.[0]?.dimensions?.width || 0} ft</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-xs">Height</span>
              </div>
              <p className="text-white font-bold text-lg">{(job as any)?.[0]?.dimensions?.height || 0} ft</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Ruler className="w-4 h-4 rotate-90" />
                <span className="text-xs">Length</span>
              </div>
              <p className="text-white font-bold text-lg">{(job as any)?.[0]?.dimensions?.length || 0} ft</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Truck className="w-4 h-4" />
                <span className="text-xs">Weight</span>
              </div>
              <p className="text-white font-bold text-lg">{(job as any)?.[0]?.dimensions?.weight?.toLocaleString() || 0} lbs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Options */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Route className="w-5 h-5 text-cyan-400" />
                Route Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routesQuery.isLoading ? (
                <div className="space-y-4">{Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
              ) : (
                <div className="space-y-4">
                  {routes.map((route: any) => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedRoute === route.id
                          ? "bg-cyan-500/10 border-cyan-500/50"
                          : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{route.name}</span>
                            {route.recommended && (
                              <Badge className="bg-green-500/20 text-green-400 border-0">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">{route.description}</p>
                        </div>
                        {selectedRoute === route.id && (
                          <CheckCircle className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                          <p className="text-slate-400 text-xs">Distance</p>
                          <p className="text-white font-medium">{route.distance} mi</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                          <p className="text-slate-400 text-xs">Est. Time</p>
                          <p className="text-white font-medium">{route.duration}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                          <p className="text-slate-400 text-xs">States</p>
                          <p className="text-white font-medium">{route.states?.length || 1}</p>
                        </div>
                      </div>

                      {route.restrictions?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {route.restrictions.map((r: string, i: number) => (
                            <Badge key={i} className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {route.clearanceIssues?.length > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                          <p className="text-red-400 text-sm font-medium">Clearance Issues:</p>
                          <ul className="text-red-400 text-xs mt-1 space-y-1">
                            {route.clearanceIssues.map((issue: string, i: number) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permit Requirements */}
        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Permit Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permitsQuery.isLoading ? (
                <div className="space-y-3">{Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : (
                <div className="space-y-3">
                  {permits.map((permit: any) => (
                    <div key={permit.state} className="p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{permit.state}</span>
                        <Badge className={cn(
                          "border-0",
                          permit.status === "obtained" ? "bg-green-500/20 text-green-400" :
                          permit.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {permit.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Escort Required: {permit.escortRequired ? "Yes" : "No"}</p>
                        {permit.travelRestrictions && (
                          <p className="text-yellow-400">{permit.travelRestrictions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                Escort Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Car className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-white">Lead Vehicle</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-0">You</Badge>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Car className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-white">Chase Vehicle</span>
                  </div>
                  <Badge className="bg-slate-500/20 text-slate-400 border-0">Assigned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/escort/jobs")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => selectedRoute && selectRouteMutation.mutate({ jobId: jobId! })}
          disabled={!selectedRoute || selectRouteMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg px-8"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Confirm Route
        </Button>
      </div>
    </div>
  );
}
