/**
 * HAZMAT ENDORSEMENT PAGE
 * Driver-facing screen for managing hazmat endorsement (H) on CDL.
 * Tracks TSA security threat assessment status, endorsement expiry,
 * training requirements, and renewal workflow.
 * Per 49 CFR 1572 — TSA background check required for H endorsement.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Shield, CheckCircle, AlertTriangle, Clock, Award,
  FileText, Calendar, RefreshCw, ChevronRight, Upload,
  BookOpen, Fingerprint, Eye, ArrowRight, Lock
} from "lucide-react";

function daysUntil(dateStr: string | undefined | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(days: number): { label: string; cls: string } {
  if (days < 0) return { label: "Expired", cls: "bg-red-500/15 text-red-500 border-red-500/30" };
  if (days <= 30) return { label: "Expiring Soon", cls: "bg-orange-500/15 text-orange-500 border-orange-500/30" };
  if (days <= 90) return { label: "Renewal Window", cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" };
  return { label: "Active", cls: "bg-green-500/15 text-green-500 border-green-500/30" };
}

const RENEWAL_STEPS = [
  { id: "tsa", label: "TSA Security Threat Assessment", description: "Submit fingerprints and background check via TSA-approved enrollment center", icon: <Fingerprint className="w-4 h-4" /> },
  { id: "training", label: "Hazmat Training (49 CFR 172.704)", description: "Complete general awareness, function-specific, safety, and security training", icon: <BookOpen className="w-4 h-4" /> },
  { id: "exam", label: "CDL Hazmat Knowledge Test", description: "Pass the state DMV hazmat endorsement written exam", icon: <FileText className="w-4 h-4" /> },
  { id: "submit", label: "Submit to State DMV", description: "Present TSA approval letter, training certificate, and test results", icon: <Upload className="w-4 h-4" /> },
];

export default function HazmatEndorsement() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const profileQuery = (trpc as any).drivers?.getProfile?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const certsQuery = (trpc as any).drivers?.getCertifications?.useQuery?.({}) || { data: [], isLoading: false };

  const profile = profileQuery.data;
  const certs = Array.isArray(certsQuery.data) ? certsQuery.data : [];

  const hazmatCert = certs.find((c: any) =>
    c.type === "hazmat" || c.certType === "hazmat" || c.type === "hazmat_endorsement"
  );
  const hasEndorsement = profile?.hazmatEndorsement || !!hazmatCert;
  const endorsementExpiry = hazmatCert?.expirationDate || hazmatCert?.expiryDate || profile?.cdl?.expirationDate || "";
  const tsaExpiry = hazmatCert?.tsaExpiry || "";

  const endorsementDays = daysUntil(endorsementExpiry);
  const tsaDays = daysUntil(tsaExpiry);
  const endorsementStatus = expiryBadge(endorsementDays);
  const tsaStatus = tsaExpiry ? expiryBadge(tsaDays) : { label: "N/A", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };

  const isLoading = profileQuery.isLoading || certsQuery.isLoading;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hazmat Endorsement
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            CDL "H" endorsement status and renewal management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")}
          onClick={() => profileQuery.refetch?.()}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Status Hero Card */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className={cn("h-1.5", hasEndorsement ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-red-500 to-orange-500")} />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Endorsement badge visual */}
                <div className={cn(
                  "w-32 h-32 rounded-3xl flex flex-col items-center justify-center flex-shrink-0",
                  hasEndorsement
                    ? isLight ? "bg-gradient-to-br from-green-50 to-emerald-50" : "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                    : isLight ? "bg-gradient-to-br from-red-50 to-orange-50" : "bg-gradient-to-br from-red-500/10 to-orange-500/10"
                )}>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black mb-1",
                    hasEndorsement
                      ? isLight ? "bg-white shadow-sm text-green-600" : "bg-slate-800/50 text-green-400"
                      : isLight ? "bg-white shadow-sm text-red-500" : "bg-slate-800/50 text-red-400"
                  )}>
                    H
                  </div>
                  <p className={cn("text-[10px] font-medium", hasEndorsement ? "text-green-500" : "text-red-400")}>
                    {hasEndorsement ? "ENDORSED" : "NOT ENDORSED"}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                      {hasEndorsement ? "Hazmat Endorsement Active" : "Hazmat Endorsement Required"}
                    </p>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                      {hasEndorsement
                        ? "You are authorized to transport hazardous materials"
                        : "Complete the steps below to obtain your H endorsement"
                      }
                    </p>
                  </div>

                  {hasEndorsement && (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", endorsementStatus.cls)}>
                        CDL: {endorsementStatus.label}
                        {endorsementDays > 0 && endorsementDays < 999 && ` (${endorsementDays}d)`}
                      </Badge>
                      <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", tsaStatus.cls)}>
                        TSA: {tsaStatus.label}
                        {tsaDays > 0 && tsaDays < 999 && ` (${tsaDays}d)`}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Shield className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: hasEndorsement ? "Active" : "Inactive", label: "Endorsement", color: hasEndorsement ? "text-green-400" : "text-red-400" },
              { icon: <Fingerprint className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: tsaExpiry ? (tsaDays > 0 ? `${tsaDays}d` : "Expired") : "Pending", label: "TSA Clearance", color: "text-blue-400" },
              { icon: <Calendar className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: endorsementExpiry ? new Date(endorsementExpiry).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A", label: "Expiration", color: "text-purple-400" },
              { icon: <BookOpen className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: "49 CFR 172.704", label: "Training Req", color: "text-cyan-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                    <div>
                      <p className={cn("text-sm font-bold", s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Renewal / Acquisition Steps */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Award className="w-5 h-5 text-[#1473FF]" />
                {hasEndorsement ? "Renewal Process" : "How to Obtain"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className={cn("absolute left-[11px] top-2 bottom-2 w-px", isLight ? "bg-slate-200" : "bg-slate-700")} />
                {RENEWAL_STEPS.map((step, i) => (
                  <div key={step.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    <div className={cn(
                      "absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 z-10",
                      isLight ? "bg-white border-slate-300 text-slate-400" : "bg-slate-800 border-slate-600 text-slate-500"
                    )}>
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className={cn(
                      "flex-1 p-4 rounded-xl border transition-colors",
                      isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg flex-shrink-0", "bg-[#1473FF]/10 text-[#1473FF]")}>
                          {step.icon}
                        </div>
                        <div>
                          <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{step.label}</p>
                          <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regulation reference */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          )}>
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">TSA Security Requirement (49 CFR 1572)</p>
              <p className="text-xs mt-0.5 opacity-80">
                All drivers applying for or renewing an HME must undergo a TSA security threat assessment,
                including fingerprint-based criminal history and immigration checks. The TSA determination
                letter is valid for 5 years and must be presented to the state DMV.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
