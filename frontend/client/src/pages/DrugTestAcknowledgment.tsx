/**
 * DRUG TEST ACKNOWLEDGMENT PAGE
 * Driver-facing FMCSA drug & alcohol testing compliance screen.
 * Tracks pre-employment, random, post-accident, reasonable suspicion,
 * return-to-duty, and follow-up testing per 49 CFR Part 40 & 382.
 * Includes FMCSA Clearinghouse query status and acknowledgment workflow.
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
  Calendar, RefreshCw, Eye, ChevronRight, Clipboard,
  Activity, Lock, Database, ArrowRight
} from "lucide-react";

type TestType = "pre_employment" | "random" | "post_accident" | "reasonable_suspicion" | "return_to_duty" | "follow_up";

const TEST_TYPES: { id: TestType; label: string; description: string; regulation: string }[] = [
  { id: "pre_employment", label: "Pre-Employment", description: "Required before performing safety-sensitive functions", regulation: "49 CFR 382.301" },
  { id: "random", label: "Random", description: "Unannounced selection from driver pool (50% drugs, 10% alcohol)", regulation: "49 CFR 382.305" },
  { id: "post_accident", label: "Post-Accident", description: "After DOT-recordable accidents meeting threshold criteria", regulation: "49 CFR 382.303" },
  { id: "reasonable_suspicion", label: "Reasonable Suspicion", description: "When trained supervisor observes signs of substance use", regulation: "49 CFR 382.307" },
  { id: "return_to_duty", label: "Return-to-Duty", description: "Required before returning after a violation", regulation: "49 CFR 382.309" },
  { id: "follow_up", label: "Follow-Up", description: "Minimum 6 direct-observation tests in first 12 months", regulation: "49 CFR 382.311" },
];

const ACKNOWLEDGMENT_ITEMS = [
  "I understand that I am subject to drug and alcohol testing as required by 49 CFR Part 382.",
  "I acknowledge that a positive test, refusal to test, or adulterated/substituted specimen will result in immediate removal from safety-sensitive functions.",
  "I understand that all test results are reported to the FMCSA Drug & Alcohol Clearinghouse.",
  "I consent to pre-employment, random, post-accident, reasonable suspicion, return-to-duty, and follow-up testing.",
  "I have received and reviewed the company's drug and alcohol policy.",
  "I understand my right to request a split specimen test within 72 hours of notification of a verified positive result.",
];

export default function DrugTestAcknowledgment() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [acknowledged, setAcknowledged] = useState<boolean[]>(ACKNOWLEDGMENT_ITEMS.map(() => false));
  const [signed, setSigned] = useState(false);

  const clearinghouseQuery = (trpc as any).clearinghouse?.getStatus?.useQuery?.() || { data: null, isLoading: false };
  const testsQuery = (trpc as any).compliance?.getDrugTestHistory?.useQuery?.() || (trpc as any).clearinghouse?.getHistory?.useQuery?.() || { data: [], isLoading: false };

  const clearinghouse = clearinghouseQuery.data;
  const tests: any[] = Array.isArray(testsQuery.data) ? testsQuery.data : [];
  const isLoading = clearinghouseQuery.isLoading;

  const allAcknowledged = acknowledged.every(Boolean);
  const acknowledgedCount = acknowledged.filter(Boolean).length;

  const toggleAck = (index: number) => {
    setAcknowledged((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleSign = () => {
    if (!allAcknowledged) {
      toast.error("Please acknowledge all items before signing");
      return;
    }
    setSigned(true);
    toast.success("Drug & alcohol testing acknowledgment signed successfully");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Drug & Alcohol Testing
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            FMCSA compliance acknowledgment — 49 CFR Part 382
          </p>
        </div>
        <Badge className={cn(
          "rounded-full px-3 py-1 text-xs font-medium border",
          signed
            ? "bg-green-500/15 text-green-500 border-green-500/30"
            : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30"
        )}>
          {signed ? "Acknowledged" : "Pending Signature"}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Shield className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: clearinghouse?.status === "clear" ? "Clear" : "Check Required", label: "Clearinghouse Status", color: clearinghouse?.status === "clear" ? "text-green-400" : "text-yellow-400" },
              { icon: <Activity className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(tests.length), label: "Tests on File", color: "text-blue-400" },
              { icon: <Calendar className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: clearinghouse?.lastQueryDate ? new Date(clearinghouse.lastQueryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A", label: "Last Query", color: "text-purple-400" },
              { icon: <Database className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: "FMCSA", label: "Clearinghouse", color: "text-cyan-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.02] border-white/[0.06]")}>
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

          {/* Testing Types Reference */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Activity className="w-5 h-5 text-[#1473FF]" />
                Required Testing Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEST_TYPES.map((tt) => (
                  <div key={tt.id} className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border",
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                  )}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold", "bg-[#1473FF]/10 text-[#1473FF]")}>
                      {tt.id === "pre_employment" ? "PE" : tt.id === "random" ? "RN" : tt.id === "post_accident" ? "PA" : tt.id === "reasonable_suspicion" ? "RS" : tt.id === "return_to_duty" ? "RT" : "FU"}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{tt.label}</p>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{tt.description}</p>
                      <p className={cn("text-[10px] font-mono mt-1", isLight ? "text-blue-500" : "text-blue-400")}>{tt.regulation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment Checklist */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Clipboard className="w-5 h-5 text-[#BE01FF]" />
                  Driver Acknowledgment
                </CardTitle>
                <span className={cn("text-xs font-medium", isLight ? "text-slate-400" : "text-slate-500")}>
                  {acknowledgedCount}/{ACKNOWLEDGMENT_ITEMS.length} acknowledged
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {signed ? (
                <div className={cn(
                  "p-6 rounded-xl text-center",
                  isLight ? "bg-green-50 border border-green-200" : "bg-green-500/5 border border-green-500/20"
                )}>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className={cn("text-lg font-bold", isLight ? "text-green-700" : "text-green-400")}>
                    Acknowledgment Signed
                  </p>
                  <p className={cn("text-sm mt-1", isLight ? "text-green-600" : "text-green-400/80")}>
                    Your drug and alcohol testing acknowledgment is on file.
                  </p>
                  <p className={cn("text-xs mt-2", isLight ? "text-slate-400" : "text-slate-500")}>
                    Signed on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ) : (
                <>
                  {ACKNOWLEDGMENT_ITEMS.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => toggleAck(index)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left",
                        acknowledged[index]
                          ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/20"
                          : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors mt-0.5",
                        acknowledged[index]
                          ? "bg-green-500 border-green-500"
                          : isLight ? "border-slate-300" : "border-slate-600"
                      )}>
                        {acknowledged[index] && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        acknowledged[index]
                          ? "text-green-600 line-through opacity-70"
                          : isLight ? "text-slate-700" : "text-slate-200"
                      )}>
                        {item}
                      </p>
                    </button>
                  ))}

                  <div className="pt-3">
                    <Button
                      className={cn(
                        "w-full h-12 rounded-xl text-base font-medium transition-all",
                        allAcknowledged
                          ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white shadow-lg shadow-purple-500/20"
                          : isLight
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white/[0.04] text-slate-500 cursor-not-allowed"
                      )}
                      disabled={!allAcknowledged}
                      onClick={handleSign}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Sign Acknowledgment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Test History */}
          {tests.length > 0 && (
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Clock className="w-5 h-5 text-[#1473FF]" />
                  Test History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tests.slice(0, 5).map((test: any, i: number) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        test.result === "negative" ? "bg-green-500/15" : "bg-red-500/15"
                      )}>
                        {test.result === "negative"
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <AlertTriangle className="w-4 h-4 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>
                          {test.type?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Drug Test"}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                          {test.date ? new Date(test.date).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-xs border",
                      test.result === "negative"
                        ? "bg-green-500/15 text-green-500 border-green-500/30"
                        : "bg-red-500/15 text-red-500 border-red-500/30"
                    )}>
                      {test.result || "Pending"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Regulation note */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          )}>
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">FMCSA Drug & Alcohol Clearinghouse</p>
              <p className="text-xs mt-0.5 opacity-80">
                As of January 6, 2020, employers must query the Clearinghouse for all current and
                prospective employees before permitting them to operate a commercial motor vehicle.
                All positive test results, refusals, and violations are recorded in the Clearinghouse database.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
