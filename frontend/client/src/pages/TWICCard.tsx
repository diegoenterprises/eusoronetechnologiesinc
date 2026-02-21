/**
 * TWIC CARD PAGE
 * Driver-facing Transportation Worker Identification Credential management.
 * Required for unescorted access to secure areas of maritime facilities
 * and vessels regulated under MTSA (46 CFR 101–106).
 * Tracks card status, expiration, enrollment, and facility access history.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React from "react";
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
  CreditCard, Shield, CheckCircle, AlertTriangle, Clock,
  Calendar, RefreshCw, Fingerprint, MapPin, Anchor,
  FileText, ChevronRight, ExternalLink, Lock, Eye
} from "lucide-react";

function daysUntil(dateStr: string | undefined | null): number {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusBadge(days: number): { label: string; cls: string; color: string } {
  if (days < 0) return { label: "Expired", cls: "bg-red-500/15 text-red-500 border-red-500/30", color: "text-red-500" };
  if (days <= 30) return { label: "Expiring Soon", cls: "bg-orange-500/15 text-orange-500 border-orange-500/30", color: "text-orange-500" };
  if (days <= 90) return { label: "Renewal Window", cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", color: "text-yellow-500" };
  return { label: "Active", cls: "bg-green-500/15 text-green-500 border-green-500/30", color: "text-green-500" };
}

const ENROLLMENT_STEPS = [
  { step: 1, title: "Pre-enroll online", detail: "Complete the TSA pre-enrollment at universalenroll.dhs.gov", icon: <FileText className="w-4 h-4" /> },
  { step: 2, title: "Schedule appointment", detail: "Visit a TWIC enrollment center for fingerprints and photo", icon: <Fingerprint className="w-4 h-4" /> },
  { step: 3, title: "Pay enrollment fee", detail: "Standard fee: $125.25 (5-year card). Reduced if you have valid HME or FAST.", icon: <CreditCard className="w-4 h-4" /> },
  { step: 4, title: "Background check", detail: "TSA conducts STA including criminal history and immigration status", icon: <Shield className="w-4 h-4" /> },
  { step: 5, title: "Pick up TWIC card", detail: "Return to enrollment center to activate and receive your TWIC", icon: <CheckCircle className="w-4 h-4" /> },
];

export default function TWICCard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const certsQuery = (trpc as any).drivers?.getCertifications?.useQuery?.({}) || { data: [], isLoading: false };
  const profileQuery = (trpc as any).drivers?.getProfile?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };

  const certs = Array.isArray(certsQuery.data) ? certsQuery.data : [];
  const twicCert = certs.find((c: any) =>
    c.type === "twic" || c.certType === "twic" || c.type === "TWIC"
  );

  const hasCard = !!twicCert;
  const cardNumber = twicCert?.number || twicCert?.certNumber || "";
  const expiryDate = twicCert?.expirationDate || twicCert?.expiryDate || "";
  const daysLeft = daysUntil(expiryDate);
  const status = statusBadge(daysLeft);
  const validityPct = Math.max(0, Math.min(100, (daysLeft / (5 * 365)) * 100));

  const isLoading = certsQuery.isLoading || profileQuery.isLoading;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            TWIC Card
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Transportation Worker Identification Credential
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
          <Skeleton className="h-52 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* TWIC Card Visual */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className={cn("h-1.5", hasCard ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "bg-gradient-to-r from-slate-400 to-slate-500")} />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Card replica */}
                <div className={cn(
                  "flex-shrink-0 w-full md:w-72 aspect-[1.6/1] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden",
                  hasCard
                    ? isLight ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-blue-700 to-blue-900"
                    : isLight ? "bg-gradient-to-br from-slate-300 to-slate-400" : "bg-gradient-to-br from-slate-600 to-slate-700"
                )}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 w-20 h-20 border-2 border-white rounded-full" />
                    <div className="absolute bottom-2 left-2 w-16 h-16 border-2 border-white rounded-full" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Anchor className="w-5 h-5 text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">TSA TWIC</span>
                      </div>
                      <Badge className={cn("text-[9px] border", status.cls)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-lg font-mono font-bold text-white tracking-wider">
                      {cardNumber || "XXXX-XXXX-XXXX"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-white/60">
                        {expiryDate ? `EXP ${new Date(expiryDate).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })}` : "NOT ENROLLED"}
                      </p>
                      <p className="text-[10px] text-white/60">5-YEAR CREDENTIAL</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  {hasCard ? (
                    <>
                      <div>
                        <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
                          TWIC Credential Active
                        </p>
                        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                          Unescorted access to MTSA-regulated facilities authorized
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-white")}>Card Validity</p>
                          <p className={cn("text-sm tabular-nums", status.color)}>
                            {daysLeft > 0 ? `${daysLeft} days remaining` : `Expired ${Math.abs(daysLeft)}d ago`}
                          </p>
                        </div>
                        <Progress value={validityPct} className="h-2 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={sc}>
                          <p className={cn("text-[10px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Card Number</p>
                          <p className={cn("text-sm font-bold font-mono mt-0.5", isLight ? "text-slate-800" : "text-white")}>{cardNumber || "On file"}</p>
                        </div>
                        <div className={sc}>
                          <p className={cn("text-[10px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Expires</p>
                          <p className={cn("text-sm font-bold mt-0.5", isLight ? "text-slate-800" : "text-white")}>
                            {expiryDate ? new Date(expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
                        TWIC Card Not On File
                      </p>
                      <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                        A TWIC is required for unescorted access to secure areas of ports, terminals,
                        and vessels regulated under the Maritime Transportation Security Act.
                      </p>
                      <Button
                        className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11"
                        onClick={() => window.open("https://universalenroll.dhs.gov/programs/twic", "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Begin Enrollment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Lock className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: hasCard ? "Cleared" : "Needed", label: "Security Status", color: "text-blue-400" },
              { icon: <Anchor className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: "MTSA", label: "Regulation", color: "text-cyan-400" },
              { icon: <Calendar className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: "5 Years", label: "Validity Period", color: "text-purple-400" },
              { icon: <CreditCard className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: "$125.25", label: "Enrollment Fee", color: "text-green-400" },
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

          {/* Enrollment Process */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Fingerprint className="w-5 h-5 text-[#BE01FF]" />
                {hasCard ? "Renewal Process" : "Enrollment Process"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className={cn("absolute left-[11px] top-2 bottom-2 w-px", isLight ? "bg-slate-200" : "bg-slate-700")} />
                {ENROLLMENT_STEPS.map((step) => (
                  <div key={step.step} className="relative flex items-start gap-4 pb-5 last:pb-0">
                    <div className={cn(
                      "absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 z-10 text-[10px] font-bold",
                      isLight ? "bg-white border-slate-300 text-slate-400" : "bg-slate-800 border-slate-600 text-slate-500"
                    )}>
                      {step.step}
                    </div>
                    <div className={cn(
                      "flex-1 flex items-start gap-3 p-3 rounded-xl border",
                      isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
                    )}>
                      <div className={cn("p-2 rounded-lg flex-shrink-0", "bg-[#1473FF]/10 text-[#1473FF]")}>
                        {step.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{step.title}</p>
                        <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Where TWIC is required */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <MapPin className="w-5 h-5 text-[#1473FF]" />
                Where TWIC Is Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "Marine terminals & ports", note: "Any MTSA-regulated facility" },
                  { name: "Oil & gas terminals", note: "Coastal and inland waterway facilities" },
                  { name: "Chemical plants (waterfront)", note: "Facilities with vessel operations" },
                  { name: "Refineries with dock access", note: "Loading/unloading at marine berths" },
                  { name: "LNG/LPG terminals", note: "Liquefied gas import/export facilities" },
                  { name: "Cruise & ferry terminals", note: "Passenger vessel facilities" },
                ].map((loc, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border",
                    isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
                  )}>
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Anchor className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{loc.name}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{loc.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
