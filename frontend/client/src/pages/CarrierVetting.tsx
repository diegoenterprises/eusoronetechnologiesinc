/**
 * CARRIER VETTING PAGE
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
  Shield, Building, CheckCircle, XCircle, Clock, Search,
  RefreshCw, Eye, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CarrierVetting() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const carriersQuery = trpc.carriers.getPendingVetting.useQuery({ limit: 50 });
  const summaryQuery = trpc.carriers.getVettingSummary.useQuery();

  const verifyMutation = trpc.carriers.verifySAFER.useMutation({
    onSuccess: () => { toast.success("SAFER verification complete"); carriersQuery.refetch(); },
    onError: (error) => toast.error("Verification failed", { description: error.message }),
  });

  const approveMutation = trpc.carriers.approve.useMutation({
    onSuccess: () => { toast.success("Carrier approved"); carriersQuery.refetch(); },
    onError: (error) => toast.error("Approval failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "verifying": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Verifying</Badge>;
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCarriers = carriersQuery.data?.filter((carrier: any) => {
    return !searchTerm || 
      carrier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Carrier Vetting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Verify and approve carrier applications</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Building className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.approved || 0}</p>
                )}
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or MC number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Carriers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Pending Verification</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredCarriers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Building className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No carriers pending vetting</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCarriers?.map((carrier: any) => (
                <div key={carrier.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", carrier.status === "approved" ? "bg-green-500/20" : carrier.status === "pending" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                        <Building className={cn("w-6 h-6", carrier.status === "approved" ? "text-green-400" : carrier.status === "pending" ? "text-yellow-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{carrier.name}</p>
                          {getStatusBadge(carrier.status)}
                        </div>
                        <p className="text-sm text-slate-400">MC# {carrier.mcNumber} • DOT# {carrier.dotNumber}</p>
                        <p className="text-xs text-slate-500">Applied: {carrier.appliedDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 text-blue-400 rounded-lg" onClick={() => verifyMutation.mutate({ carrierId: carrier.id })} disabled={verifyMutation.isPending}>
                        <RefreshCw className="w-4 h-4 mr-1" />SAFER
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => approveMutation.mutate({ carrierId: carrier.id })} disabled={approveMutation.isPending}>
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation(`/carriers/${carrier.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Verification Checklist */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {carrier.checklist?.map((item: any) => (
                      <div key={item.name} className={cn("p-3 rounded-xl flex items-center gap-2", item.verified ? "bg-green-500/10 border border-green-500/20" : "bg-slate-700/30")}>
                        {item.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : item.failed ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={cn("text-sm", item.verified ? "text-green-400" : item.failed ? "text-red-400" : "text-slate-400")}>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Safety Score */}
                  {carrier.safetyScore && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">SAFER Safety Score</span>
                        <span className={cn("font-bold", carrier.safetyScore >= 80 ? "text-green-400" : carrier.safetyScore >= 60 ? "text-yellow-400" : "text-red-400")}>{carrier.safetyScore}</span>
                      </div>
                      <Progress value={carrier.safetyScore} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
