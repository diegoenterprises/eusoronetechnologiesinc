/**
 * DRIVER QUALIFICATION FILES PAGE
 * Frontend for driverQualification router — DQ file management per 49 CFR 391.51
 * Document tracking, employment history, annual reviews, expiring items.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  FileText, Shield, Clock, CheckCircle, AlertTriangle, Search,
  Upload, Bell, Calendar, Users, Briefcase, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  valid: "bg-green-500/20 text-green-400",
  qualified: "bg-green-500/20 text-green-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  missing: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

export default function DriverQualificationFiles() {
  const [driverId, setDriverId] = useState("");
  const [activeDriverId, setActiveDriverId] = useState<string>("");

  const overviewQuery = (trpc as any).driverQualification.getOverview.useQuery(
    { driverId: activeDriverId },
    { enabled: !!activeDriverId }
  );
  const docsQuery = (trpc as any).driverQualification.getDocuments.useQuery(
    { driverId: activeDriverId },
    { enabled: !!activeDriverId }
  );
  const empHistoryQuery = (trpc as any).driverQualification.getEmploymentHistory.useQuery(
    { driverId: activeDriverId },
    { enabled: !!activeDriverId }
  );
  const annualReviewQuery = (trpc as any).driverQualification.getAnnualReview.useQuery(
    { driverId: activeDriverId },
    { enabled: !!activeDriverId }
  );
  const expiringQuery = (trpc as any).driverQualification.getExpiringItems.useQuery({ daysAhead: 60 });
  const complianceQuery = (trpc as any).driverQualification.getComplianceReport.useQuery({ scope: "fleet" });

  const sendReminderMutation = (trpc as any).driverQualification.sendReminder.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
    onError: (e: any) => toast.error(e.message),
  });

  const overview = overviewQuery.data;
  const docs = docsQuery.data?.documents || [];
  const empHistory = empHistoryQuery.data;
  const annualReview = annualReviewQuery.data;
  const expiringItems = expiringQuery.data || [];
  const complianceReport = complianceQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Driver Qualification Files</h1>
          <p className="text-slate-400 text-sm mt-1">49 CFR 391.51 DQ file management</p>
        </div>
      </div>

      {/* Fleet Compliance Summary */}
      {complianceReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-400">{complianceReport.summary?.totalDrivers || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Total Drivers</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400">{complianceReport.summary?.fullyCompliant || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Fully Compliant</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-400">{complianceReport.summary?.partiallyCompliant || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Partial</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-400">{complianceReport.summary?.complianceRate || 0}%</p>
              <p className="text-[9px] text-slate-400 uppercase">Compliance Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Driver */}
      <div className="flex gap-2">
        <Input placeholder="Enter Driver ID..." value={driverId} onChange={e => setDriverId(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white max-w-xs" />
        <Button onClick={() => setActiveDriverId(driverId)} disabled={!driverId} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
          <Search className="w-4 h-4 mr-2" />Lookup DQ File
        </Button>
      </div>

      {/* Driver DQ Overview */}
      {activeDriverId && overview && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1473FF]" />
              {overview.driverName || `Driver #${overview.driverId}`}
              <Badge className={cn("text-[9px] ml-2", STATUS_COLORS[overview.status])}>{overview.status}</Badge>
              <span className="ml-auto text-sm text-slate-400">Score: {overview.complianceScore}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-lg font-bold text-white">{overview.documents?.total || 0}</p>
                <p className="text-[9px] text-slate-400">Total</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-lg font-bold text-green-400">{overview.documents?.valid || 0}</p>
                <p className="text-[9px] text-slate-400">Valid</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-lg font-bold text-yellow-400">{overview.documents?.expiringSoon || 0}</p>
                <p className="text-[9px] text-slate-400">Expiring</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-lg font-bold text-red-400">{overview.documents?.expired || 0}</p>
                <p className="text-[9px] text-slate-400">Expired</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/30 border border-slate-700/20">
                <p className="text-lg font-bold text-red-400">{overview.documents?.missing || 0}</p>
                <p className="text-[9px] text-slate-400">Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {activeDriverId && docs.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" />DQ Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {docs.map((d: any) => (
                <div key={d.id} className="p-3 flex items-center justify-between hover:bg-slate-700/20">
                  <div>
                    <p className="text-white text-sm font-medium">{d.name || d.type}</p>
                    <p className="text-xs text-slate-500">{d.type} · Uploaded {d.uploadedAt}</p>
                  </div>
                  <Badge className={cn("text-[9px]", STATUS_COLORS[d.status])}>{d.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employment History */}
      {activeDriverId && empHistory && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />Employment History
              <Badge className={cn("text-[9px] ml-2", empHistory.compliant ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>
                {empHistory.yearsVerified}/{empHistory.requiredYears} years
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empHistory.employers?.length > 0 ? (
              <div className="space-y-2">
                {empHistory.employers.map((e: any) => (
                  <div key={e.id} className="p-2 rounded-lg bg-slate-900/30 border border-slate-700/20 flex items-center justify-between">
                    <span className="text-sm text-white">{e.name}</span>
                    <Badge className={cn("text-[9px]", STATUS_COLORS[e.status])}>{e.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No employment records on file</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expiring Items Alert */}
      {expiringItems.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />Expiring Items (Next 60 Days)
              <Badge className="bg-red-500/20 text-red-400 text-[10px] ml-auto">{expiringItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-500/10">
              {expiringItems.slice(0, 15).map((item: any, i: number) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{item.type}</p>
                    <p className="text-xs text-slate-500">Driver #{item.driverId} · Expires {item.expiresAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[9px]", item.daysRemaining <= 14 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>
                      {item.daysRemaining}d
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => sendReminderMutation.mutate({ driverId: String(item.driverId), documentType: "medical_card" })} className="h-7 px-2">
                      <Bell className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
