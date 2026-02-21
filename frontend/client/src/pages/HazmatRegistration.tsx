/**
 * HAZMAT REGISTRATION PAGE
 * Carrier hazmat registration and PHMSA compliance tracker.
 * Displays PHMSA registration status, DOT special permits,
 * hazmat safety permit requirements (49 CFR 385.400), and
 * registration renewal workflow.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Shield, CheckCircle, AlertTriangle, Clock, FileText,
  Calendar, RefreshCw, ExternalLink, ChevronRight,
  Truck, Lock, Database, Award
} from "lucide-react";

type RegistrationStatus = "active" | "pending" | "expired" | "not_registered";

const REG_REQUIREMENTS = [
  { id: "phmsa", label: "PHMSA Registration", description: "Biennial hazmat carrier registration with DOT (49 CFR 107.601)", fee: "$300–$3,000/yr based on volume", required: true },
  { id: "safety_permit", label: "Hazmat Safety Permit", description: "Required for highway route-controlled quantities (49 CFR 385.403)", fee: "No additional fee", required: true },
  { id: "security_plan", label: "Security Plan on File", description: "Written security plan per 49 CFR 172.800 for Table 1 materials", fee: "N/A", required: true },
  { id: "insurance", label: "Hazmat Insurance", description: "Minimum $5M public liability for certain hazmat (49 CFR 387.9)", fee: "Varies by carrier", required: true },
  { id: "training_records", label: "Training Records", description: "Current hazmat training records for all hazmat employees (49 CFR 172.704)", fee: "N/A", required: true },
  { id: "drug_testing", label: "Drug & Alcohol Program", description: "FMCSA-compliant D&A testing program for CDL holders (49 CFR 382)", fee: "N/A", required: true },
];

const PERMIT_CLASSES = [
  { cls: "1.1 / 1.2 / 1.3", name: "Explosives (Divisions 1.1, 1.2, 1.3)", permit: "Required" },
  { cls: "2.3", name: "Poison Gas (PIH Zone A/B)", permit: "Required" },
  { cls: "6.1", name: "Poison (PG I, Inhalation Hazard)", permit: "Required" },
  { cls: "7", name: "Radioactive (Highway Route Controlled)", permit: "Required" },
  { cls: "3 / 8", name: "Flammable Liquid / Corrosive (bulk >3,500 gal)", permit: "Conditional" },
];

export default function HazmatRegistration() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [completedItems, setCompletedItems] = useState<string[]>(["phmsa", "security_plan", "drug_testing"]);

  const complianceQuery = (trpc as any).compliance?.getCompanyCompliance?.useQuery?.() ||
    (trpc as any).compliance?.getDriverCompliance?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const isLoading = complianceQuery.isLoading;

  const toggleItem = (id: string) => {
    setCompletedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const completionPct = Math.round((completedItems.length / REG_REQUIREMENTS.length) * 100);

  const regStatus: RegistrationStatus = completionPct === 100 ? "active" : completionPct > 50 ? "pending" : "not_registered";

  const statusConfig: Record<RegistrationStatus, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-green-500/15 text-green-500 border-green-500/30" },
    pending: { label: "In Progress", cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
    expired: { label: "Expired", cls: "bg-red-500/15 text-red-500 border-red-500/30" },
    not_registered: { label: "Not Registered", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Hazmat Registration
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            PHMSA carrier registration — 49 CFR 107 Subpart G
          </p>
        </div>
        <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium border", statusConfig[regStatus].cls)}>
          {statusConfig[regStatus].label}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Shield className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: `${completionPct}%`, label: "Compliance", color: "text-green-400" },
              { icon: <FileText className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: `${completedItems.length}/${REG_REQUIREMENTS.length}`, label: "Requirements Met", color: "text-blue-400" },
              { icon: <Calendar className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: "Jun 2026", label: "Next Renewal", color: "text-purple-400" },
              { icon: <Award className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: "PHMSA", label: "Authority", color: "text-cyan-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.02] border-white/[0.06]")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                    <div>
                      <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Registration Checklist */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Database className="w-5 h-5 text-[#1473FF]" />
                Registration Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {REG_REQUIREMENTS.map((req) => {
                const isComplete = completedItems.includes(req.id);
                return (
                  <button
                    key={req.id}
                    onClick={() => toggleItem(req.id)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                      isComplete
                        ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                        : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors mt-0.5",
                      isComplete ? "bg-green-500 border-green-500" : isLight ? "border-slate-300" : "border-slate-600"
                    )}>
                      {isComplete && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          isComplete ? "text-green-600" : isLight ? "text-slate-800" : "text-white"
                        )}>
                          {req.label}
                        </p>
                        {req.required && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[8px]">Required</Badge>}
                      </div>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{req.description}</p>
                      <p className={cn("text-[10px] mt-1 font-mono", isLight ? "text-blue-500" : "text-blue-400")}>Fee: {req.fee}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Safety Permit Classes */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Truck className="w-5 h-5 text-[#BE01FF]" />
                Hazmat Safety Permit — Required Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PERMIT_CLASSES.map((pc) => (
                <div key={pc.cls} className={cn(
                  "flex items-center justify-between p-3 rounded-xl border",
                  isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rotate-45 rounded-lg border-2 border-red-500 bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="-rotate-45 text-[10px] font-black text-red-500">{pc.cls.split("/")[0].trim()}</span>
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{pc.name}</p>
                      <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Class {pc.cls}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-[10px] border",
                    pc.permit === "Required" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                  )}>
                    {pc.permit}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Regulation note */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          )}>
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">PHMSA Registration Portal</p>
              <p className="text-xs mt-0.5 opacity-80">
                Registration must be filed online at the PHMSA Registration System. Carriers must
                re-register every two years (odd-numbered years for odd registration numbers). Operating
                without a valid registration is a federal violation with penalties up to $79,976 per violation.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
