/**
 * ESCORT JOB ACCEPTANCE PAGE
 * 100% Dynamic - Review and accept escort job offers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  Truck, MapPin, Calendar, DollarSign, Clock,
  ChevronLeft, CheckCircle, XCircle, AlertTriangle,
  Shield, Navigation, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortJobAcceptance() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/escort/job-offer/:jobId");
  const jobId = params?.jobId;

  const jobQuery = (trpc as any).escorts.getAvailableJobs.useQuery({});
  const requirementsQuery = (trpc as any).escorts.getCertifications.useQuery();
  const userCertsQuery = (trpc as any).escorts.getCertifications.useQuery();

  const acceptMutation = (trpc as any).escorts.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Job accepted");
      navigate("/escort/active-jobs");
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const declineMutation = (trpc as any).escorts.updateJobStatus.useMutation({
    onSuccess: () => {
      toast.success("Job declined");
      navigate("/escort/job-bidding");
    },
  });

  const job = (jobQuery.data || []).find((j: any) => j.id === jobId) as any;
  const requirements = requirementsQuery.data || [];
  const myCerts = userCertsQuery.data || [];

  const meetsRequirements = requirements.every((req: any) =>
    myCerts.some((cert: any) => cert.type === req.type && cert.state === req.state && !cert.expired)
  );

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
          onClick={() => navigate("/escort/job-bidding")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Job Offer
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and accept</p>
        </div>
        {job?.urgent && (
          <Badge className="bg-red-500/20 text-red-400 border-0 animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />Urgent
          </Badge>
        )}
      </div>

      {/* Job Summary */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-400 text-sm">Escort Pay</p>
              <p className="text-4xl font-bold text-green-400">${job?.pay?.toLocaleString()}</p>
            </div>
            <Badge className={cn(
              "border-0 text-sm px-3 py-1",
              job?.position === "lead" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400"
            )}>
              {job?.position === "lead" ? "Lead Vehicle" : "Chase Vehicle"}
            </Badge>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{job?.origin?.city}</p>
              <p className="text-slate-400 text-sm">{job?.origin?.state}</p>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-red-400" />
              <div className="w-3 h-3 rounded-full bg-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{job?.destination?.city}</p>
              <p className="text-slate-400 text-sm">{job?.destination?.state}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Navigation className="w-3 h-3" />Distance</p>
              <p className="text-white font-medium">{job?.distance} miles</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Est. Duration</p>
              <p className="text-white font-medium">{job?.estimatedHours}h</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Start Date</p>
              <p className="text-white font-medium">{job?.startDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" />Rate</p>
              <p className="text-white font-medium">${(job?.pay / job?.distance).toFixed(2)}/mi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Details */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            Load Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-xs">Load Type</p>
              <p className="text-white font-medium">{job?.loadType}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Dimensions</p>
              <p className="text-white font-medium">{job?.dimensions?.width}' W × {job?.dimensions?.height}' H × {job?.dimensions?.length}' L</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Weight</p>
              <p className="text-white font-medium">{job?.weight?.toLocaleString()} lbs</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Carrier</p>
              <p className="text-white font-medium">{job?.carrier?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements Check */}
      <Card className={cn(
        "rounded-xl",
        meetsRequirements ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className={cn(
            "text-lg flex items-center gap-2",
            meetsRequirements ? "text-green-400" : "text-red-400"
          )}>
            <Shield className="w-5 h-5" />
            Requirements Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirements.map((req: any, idx: number) => {
              const hasCert = myCerts.some((c: any) => c.type === req.type && c.state === req.state && !c.expired);
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-white font-medium">{req.name}</p>
                    <p className="text-slate-400 text-sm">{req.state} certification required</p>
                  </div>
                  {hasCert ? (
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />Valid
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-0">
                      <XCircle className="w-3 h-3 mr-1" />Missing
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Route Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {job?.routeStates?.map((state: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-white">{state}</span>
              </div>
            ))}
          </div>
          {job?.permitNotes && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {job.permitNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => declineMutation.mutate({ jobId: jobId!, status: "cancelled" as const } as any)}
          disabled={declineMutation.isPending}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button
          onClick={() => acceptMutation.mutate({ jobId: jobId! })}
          disabled={!meetsRequirements || acceptMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-8"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Accept Job
        </Button>
      </div>

      {!meetsRequirements && (
        <p className="text-red-400 text-sm text-center">
          You do not meet all requirements for this job. Please update your certifications.
        </p>
      )}
    </div>
  );
}
