/**
 * BROKER CARRIER PREQUALIFICATION PAGE
 * 100% Dynamic - Manage carrier vetting and onboarding process
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield, Search, CheckCircle, XCircle, Clock,
  Building, FileText, AlertTriangle, Phone, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerCarrierPrequalification() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const carriersQuery = trpc.brokers.getPrequalificationCarriers.useQuery({ status: statusFilter });
  const statsQuery = trpc.brokers.getPrequalificationStats.useQuery();

  const approveCarrierMutation = trpc.brokers.approveCarrier.useMutation({
    onSuccess: () => {
      toast.success("Carrier approved");
      carriersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const rejectCarrierMutation = trpc.brokers.rejectCarrier.useMutation({
    onSuccess: () => {
      toast.success("Carrier rejected");
      carriersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const carriers = carriersQuery.data || [];
  const stats = statsQuery.data;

  const filteredCarriers = carriers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mcNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.dotNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getCheckColor = (status: string) => {
    switch (status) {
      case "passed": return "text-green-400";
      case "failed": return "text-red-400";
      case "pending": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Carrier Prequalification
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vet and onboard new carriers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Applicants</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalApplicants || stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.pendingReview || stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Rejected</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Score</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.avgScore || 85}%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, MC#, or DOT#..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carriers List */}
      <div className="space-y-4">
        {carriersQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredCarriers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carriers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCarriers.map((carrier: any) => (
            <Card key={carrier.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      carrier.status === "approved" ? "bg-green-500/20" :
                      carrier.status === "rejected" ? "bg-red-500/20" :
                      "bg-yellow-500/20"
                    )}>
                      <Building className={cn(
                        "w-7 h-7",
                        carrier.status === "approved" ? "text-green-400" :
                        carrier.status === "rejected" ? "text-red-400" :
                        "text-yellow-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{carrier.name}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                        <span>MC# {carrier.mcNumber}</span>
                        <span className="text-slate-600">|</span>
                        <span>DOT# {carrier.dotNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Overall Score</p>
                      <p className={cn(
                        "font-bold text-xl",
                        carrier.overallScore >= 80 ? "text-green-400" :
                        carrier.overallScore >= 60 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {carrier.overallScore}%
                      </p>
                    </div>
                    <Badge className={cn(
                      "border-0",
                      carrier.status === "approved" ? "bg-green-500/20 text-green-400" :
                      carrier.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {carrier.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Fleet Size</p>
                    <p className="text-white font-medium">{carrier.fleetSize} trucks</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Operating Since</p>
                    <p className="text-white font-medium">{carrier.operatingSince}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Insurance Coverage</p>
                    <p className="text-white font-medium">${carrier.insuranceCoverage?.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Applied</p>
                    <p className="text-white font-medium">{carrier.appliedDate}</p>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4 mb-4">
                  <p className="text-slate-400 text-sm mb-3">Verification Checklist</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {carrier.checks?.map((check: any) => (
                      <div key={check.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/20">
                        {check.status === "passed" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : check.status === "failed" ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={cn("text-sm", getCheckColor(check.status))}>
                          {check.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {carrier.saferData && (
                  <div className="border-t border-slate-700/50 pt-4 mb-4">
                    <p className="text-slate-400 text-sm mb-3">SAFER System Data</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center p-2 rounded-lg bg-slate-700/20">
                        <p className="text-slate-400 text-xs">Safety Rating</p>
                        <p className={cn(
                          "font-bold",
                          carrier.saferData.safetyRating === "Satisfactory" ? "text-green-400" : "text-yellow-400"
                        )}>
                          {carrier.saferData.safetyRating || "None"}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-700/20">
                        <p className="text-slate-400 text-xs">Power Units</p>
                        <p className="text-white font-bold">{carrier.saferData.powerUnits}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-700/20">
                        <p className="text-slate-400 text-xs">Drivers</p>
                        <p className="text-white font-bold">{carrier.saferData.drivers}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-700/20">
                        <p className="text-slate-400 text-xs">Inspections</p>
                        <p className="text-white font-bold">{carrier.saferData.inspections}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-700/20">
                        <p className="text-slate-400 text-xs">OOS Rate</p>
                        <p className={cn(
                          "font-bold",
                          (carrier.saferData.oosRate || 0) <= 20 ? "text-green-400" :
                          (carrier.saferData.oosRate || 0) <= 30 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {carrier.saferData.oosRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {carrier.issues && carrier.issues.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium text-sm">Issues Found</span>
                    </div>
                    <ul className="text-sm text-slate-400 space-y-1">
                      {carrier.issues.map((issue: string, idx: number) => (
                        <li key={idx}>- {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <Phone className="w-4 h-4 mr-1" />{carrier.phone}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <ExternalLink className="w-4 h-4 mr-1" />SAFER Lookup
                    </Button>
                  </div>
                  {carrier.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => rejectCarrierMutation.mutate({ carrierId: carrier.id })}
                        disabled={rejectCarrierMutation.isPending}
                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <XCircle className="w-4 h-4 mr-1" />Reject
                      </Button>
                      <Button
                        onClick={() => approveCarrierMutation.mutate({ carrierId: carrier.id })}
                        disabled={approveCarrierMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
