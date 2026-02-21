/**
 * ESCORT PERMITS PAGE
 * 100% Dynamic - No mock data
 * State certifications and permit management for oversize/overweight escorts
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  FileText, Shield, Calendar, CheckCircle, AlertTriangle,
  Clock, MapPin, RefreshCw, Plus, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortPermits() {
  const [stateFilter, setStateFilter] = useState("all");

  const permitsQuery = (trpc as any).escorts.getPermits.useQuery();
  const statsQuery = (trpc as any).escorts.getPermitStats.useQuery();
  const certificationsQuery = (trpc as any).escorts.getCertifications.useQuery();

  const renewPermitMutation = (trpc as any).escorts.renewPermit.useMutation({
    onSuccess: () => {
      toast.success("Permit renewal submitted");
      permitsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to submit renewal", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "expiring_soon":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Expiring Soon</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      case "pending":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Permits & Certifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage state permits and escort certifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="bg-white/[0.04] border-white/[0.06] hover:bg-slate-600/50 rounded-lg"
            onClick={() => permitsQuery.refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Permit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.activePermits || 0}</p>
                    <p className="text-xs text-slate-400">Active Permits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.expiringSoon || 0}</p>
                    <p className="text-xs text-slate-400">Expiring Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.statesCovered || 0}</p>
                    <p className="text-xs text-slate-400">States Covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.certifications || 0}</p>
                    <p className="text-xs text-slate-400">Certifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              State Permits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permitsQuery.isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(permitsQuery.data as any)?.map((permit: any) => (
                  <div
                    key={permit.id}
                    className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{permit.state}</span>
                        {getStatusBadge(permit.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        {permit.status === "expiring_soon" && (
                          <Button
                            size="sm"
                            className="h-7 bg-amber-600 hover:bg-amber-700"
                            onClick={() => renewPermitMutation.mutate({ permitId: permit.id })}
                            disabled={renewPermitMutation.isPending}
                          >
                            Renew
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Permit #</p>
                        <p className="text-white">{permit.permitNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Expires</p>
                        <p className={cn(
                          permit.status === "expiring_soon" ? "text-yellow-400" :
                          permit.status === "expired" ? "text-red-400" : "text-white"
                        )}>
                          {permit.expirationDate}
                        </p>
                      </div>
                    </div>
                    {permit.reciprocityStates && permit.reciprocityStates.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500">Reciprocity:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {permit.reciprocityStates.map((state: string) => (
                            <Badge key={state} className="bg-slate-600/50 text-slate-300 text-xs">
                              {state}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificationsQuery.isLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(certificationsQuery.data as any)?.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{cert.name}</span>
                      {getStatusBadge(cert.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Issued</p>
                        <p className="text-white">{cert.issuedDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Expires</p>
                        <p className={cn(
                          cert.status === "expiring_soon" ? "text-yellow-400" :
                          cert.status === "expired" ? "text-red-400" : "text-white"
                        )}>
                          {cert.expirationDate}
                        </p>
                      </div>
                    </div>
                    {cert.daysRemaining !== undefined && cert.daysRemaining > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Time remaining</span>
                          <span>{cert.daysRemaining} days</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (cert.daysRemaining / 365) * 100)} 
                          className={cn(
                            "h-1.5",
                            cert.daysRemaining <= 30 ? "[&>div]:bg-red-500" :
                            cert.daysRemaining <= 90 ? "[&>div]:bg-yellow-500" :
                            "[&>div]:bg-green-500"
                          )}
                        />
                      </div>
                    )}
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
