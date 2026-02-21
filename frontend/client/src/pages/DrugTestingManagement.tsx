/**
 * DRUG TESTING MANAGEMENT PAGE
 * Frontend for drugTesting router — DOT drug/alcohol testing compliance,
 * random pool management, scheduling, results, and Clearinghouse queries.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Beaker, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  Users, Calendar, FileText, Search, Filter, Shuffle, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const RESULT_COLORS: Record<string, string> = {
  negative: "bg-green-500/20 text-green-400",
  positive: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-slate-500/20 text-slate-400",
  refused: "bg-red-500/20 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  pre_employment: "Pre-Employment",
  random: "Random",
  post_accident: "Post-Accident",
  reasonable_suspicion: "Reasonable Suspicion",
  return_to_duty: "Return to Duty",
  follow_up: "Follow-Up",
};

export default function DrugTestingManagement() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [resultFilter, setResultFilter] = useState<string>("");

  const listQuery = (trpc as any).drugTesting.list.useQuery({
    testType: typeFilter || undefined,
    result: resultFilter || undefined,
    limit: 50,
  });
  const complianceQuery = (trpc as any).drugTesting.getComplianceStatus.useQuery();
  const poolQuery = (trpc as any).drugTesting.getRandomPool.useQuery({
    quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    year: new Date().getFullYear(),
  });

  const randomSelectionMutation = (trpc as any).drugTesting.performRandomSelection.useMutation({
    onSuccess: (data: any) => { toast.success(`${data.selectedDrivers?.length || 0} drivers selected for random testing`); },
    onError: (e: any) => toast.error(e.message),
  });

  const tests = listQuery.data?.tests || [];
  const compliance = complianceQuery.data;
  const pool = poolQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Drug & Alcohol Testing</h1>
          <p className="text-slate-400 text-sm mt-1">DOT compliance management per 49 CFR Part 40</p>
        </div>
        <Button onClick={() => randomSelectionMutation.mutate({ testType: "drug", count: 5 })} disabled={randomSelectionMutation.isPending}
          className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
          <Shuffle className="w-4 h-4 mr-2" />Random Selection
        </Button>
      </div>

      {/* Compliance Status Banner */}
      {compliance && (
        <Card className={cn("rounded-xl border", compliance.overall === "compliant" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {compliance.overall === "compliant" ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
                <div>
                  <p className={cn("font-bold", compliance.overall === "compliant" ? "text-green-400" : "text-red-400")}>
                    {compliance.overall === "compliant" ? "COMPLIANT" : "NON-COMPLIANT"}
                  </p>
                  <p className="text-xs text-slate-400">DOT Drug & Alcohol Testing Program</p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{compliance.testingMetrics?.totalTestsYTD || 0}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Tests YTD</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-400">{compliance.testingMetrics?.negativeResults || 0}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Negative</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{compliance.testingMetrics?.positiveResults || 0}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Positive</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Random Pool Stats */}
      {pool && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-400">{pool.poolSize}</p>
              <p className="text-[9px] text-slate-400 uppercase">Pool Size</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Beaker className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-cyan-400">{pool.drugTestsRequired}</p>
              <p className="text-[9px] text-slate-400 uppercase">Drug Tests Req (50%)</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Beaker className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-400">{pool.alcoholTestsRequired}</p>
              <p className="text-[9px] text-slate-400 uppercase">Alcohol Tests Req (10%)</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400">{pool.drugTestsCompleted}</p>
              <p className="text-[9px] text-slate-400 uppercase">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "pre_employment", "random", "post_accident", "reasonable_suspicion"].map(f => (
          <Button key={f} size="sm" variant={typeFilter === f ? "default" : "outline"} onClick={() => setTypeFilter(f)}
            className={typeFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {f ? TYPE_LABELS[f] || f : "All Types"}
          </Button>
        ))}
        <div className="border-l border-slate-700 mx-1" />
        {["", "negative", "positive", "pending"].map(f => (
          <Button key={f} size="sm" variant={resultFilter === f ? "default" : "outline"} onClick={() => setResultFilter(f)}
            className={resultFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {f || "All Results"}
          </Button>
        ))}
      </div>

      {/* Test List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1473FF]" />Test Records
            <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{listQuery.data?.total || 0} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center"><Beaker className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No test records found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {tests.map((t: any) => (
                <div key={t.id} className="p-3 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-medium text-sm">Test #{t.id}</span>
                      <Badge variant="outline" className="text-[9px] border-slate-600">{TYPE_LABELS[t.testType] || t.testType}</Badge>
                      <Badge className={cn("text-[9px]", RESULT_COLORS[t.result] || "bg-slate-500/20 text-slate-400")}>{t.result}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Driver #{t.driverId} · {t.testDate}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
