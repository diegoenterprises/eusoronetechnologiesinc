/**
 * DRIVER ONBOARDING PAGE
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
  Users, FileText, CheckCircle, Clock, AlertTriangle,
  Search, Plus, Eye, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function DriverOnboarding() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const applicantsQuery = trpc.drivers.getApplicants.useQuery({ limit: 50 });
  const summaryQuery = trpc.drivers.getOnboardingSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Progress</Badge>;
      case "documents": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Documents</Badge>;
      case "background": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Background Check</Badge>;
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredApplicants = applicantsQuery.data?.filter((applicant: any) => {
    return !searchTerm || applicant.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Onboarding
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage driver applications and onboarding</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Application
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
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
              <div className="p-3 rounded-full bg-purple-500/20">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.documents || 0}</p>
                )}
                <p className="text-xs text-slate-400">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{summary?.background || 0}</p>
                )}
                <p className="text-xs text-slate-400">Background</p>
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
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search applicants..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Applicants List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Applicants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {applicantsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredApplicants?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No applicants found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredApplicants?.map((applicant: any) => (
                <div key={applicant.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-full", applicant.status === "approved" ? "bg-green-500/20" : applicant.status === "pending" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                        <Users className={cn("w-5 h-5", applicant.status === "approved" ? "text-green-400" : applicant.status === "pending" ? "text-yellow-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{applicant.name}</p>
                          {getStatusBadge(applicant.status)}
                        </div>
                        <p className="text-sm text-slate-400">{applicant.email} • {applicant.phone}</p>
                        <p className="text-xs text-slate-500">Applied: {applicant.appliedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-medium">{applicant.progress}%</p>
                        <Progress value={applicant.progress} className="w-24 h-2" />
                      </div>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/onboarding/${applicant.id}`)}>
                        <Eye className="w-4 h-4 mr-1" />Review
                      </Button>
                    </div>
                  </div>

                  {/* Document Checklist */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {applicant.documents?.map((doc: any) => (
                      <Badge key={doc.name} className={cn("border-0", doc.uploaded ? "bg-green-500/20 text-green-400" : "bg-slate-600/50 text-slate-400")}>
                        {doc.uploaded ? <CheckCircle className="w-3 h-3 mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                        {doc.name}
                      </Badge>
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
