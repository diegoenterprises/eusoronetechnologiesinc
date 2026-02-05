/**
 * COMPANY VERIFICATION PAGE
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
  Building, CheckCircle, XCircle, Clock, Search,
  Eye, RefreshCw, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CompanyVerification() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const companiesQuery = (trpc as any).admin.getPendingCompanies.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).admin.getCompanyVerificationSummary.useQuery();

  const verifyMutation = (trpc as any).admin.verifyCompany.useMutation({
    onSuccess: () => { toast.success("Company verified"); companiesQuery.refetch(); },
    onError: (error: any) => toast.error("Verification failed", { description: error.message }),
  });

  const rejectMutation = (trpc as any).admin.rejectCompany.useMutation({
    onSuccess: () => { toast.success("Company rejected"); companiesQuery.refetch(); },
    onError: (error: any) => toast.error("Rejection failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0">Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      case "in_review": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Review</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "carrier": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Carrier</Badge>;
      case "shipper": return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Shipper</Badge>;
      case "broker": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Broker</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const filteredCompanies = (companiesQuery.data as any)?.filter((company: any) => {
    return !searchTerm || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.mcNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Company Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">Verify and approve company registrations</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.verified || 0}</p>
                )}
                <p className="text-xs text-slate-400">Verified</p>
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
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by name or MC number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Companies List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Pending Verification</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {companiesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredCompanies?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Building className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No companies pending verification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCompanies?.map((company: any) => (
                <div key={company.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", company.status === "verified" ? "bg-green-500/20" : company.status === "pending" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                        <Building className={cn("w-6 h-6", company.status === "verified" ? "text-green-400" : company.status === "pending" ? "text-yellow-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{company.name}</p>
                          {getStatusBadge(company.status)}
                          {getTypeBadge(company.type)}
                        </div>
                        <p className="text-sm text-slate-400">MC# {company.mcNumber} • DOT# {company.dotNumber}</p>
                        <p className="text-xs text-slate-500">Applied: {company.appliedDate} • {company.contactEmail}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {company.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg" onClick={() => rejectMutation.mutate({ companyId: company.id })} disabled={rejectMutation.isPending}>
                            <XCircle className="w-4 h-4 mr-1" />Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => verifyMutation.mutate({ companyId: company.id })} disabled={verifyMutation.isPending}>
                            <CheckCircle className="w-4 h-4 mr-1" />Verify
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation(`/companies/${company.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Verification Progress */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {company.verificationSteps?.map((step: any) => (
                      <div key={step.name} className={cn("p-2 rounded-lg flex items-center gap-2", step.completed ? "bg-green-500/10" : "bg-slate-700/30")}>
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={cn("text-xs", step.completed ? "text-green-400" : "text-slate-400")}>{step.name}</span>
                      </div>
                    ))}
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
