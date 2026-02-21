/**
 * ACCOUNTING PAGE
 * Frontend for accounting router — AR/AP, GL entries, revenue recognition, reconciliation.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertTriangle, FileText, ArrowUpRight, ArrowDownLeft, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-500/20 text-green-400",
  sent: "bg-blue-500/20 text-blue-400",
  overdue: "bg-red-500/20 text-red-400",
  draft: "bg-slate-500/20 text-slate-400",
  partial: "bg-yellow-500/20 text-yellow-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
};

export default function AccountingPage() {
  const [tab, setTab] = useState<"receivables" | "payables" | "summary">("summary");

  const receivablesQuery = (trpc as any).accounting.getReceivables.useQuery({ limit: 20 });
  const payablesQuery = (trpc as any).accounting.getPayables.useQuery({ limit: 20 });
  const summaryQuery = (trpc as any).accounting.getSummary.useQuery();
  const revenueQuery = (trpc as any).accounting.getRevenueBreakdown.useQuery();

  const receivables = receivablesQuery.data || [];
  const payables = payablesQuery.data || [];
  const summary = summaryQuery.data;
  const revenue = revenueQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Accounting</h1>
        <p className="text-slate-400 text-sm mt-1">Financial management, receivables, and payables</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20"><ArrowUpRight className="w-5 h-5 text-green-400" /></div>
                <div>
                  <p className="text-xl font-bold text-green-400">${Number(summary.totalReceivable || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Receivable</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/20"><ArrowDownLeft className="w-5 h-5 text-red-400" /></div>
                <div>
                  <p className="text-xl font-bold text-red-400">${Number(summary.totalPayable || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Payable</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20"><DollarSign className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <p className="text-xl font-bold text-purple-400">${Number(summary.netRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Net Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20"><AlertTriangle className="w-5 h-5 text-yellow-400" /></div>
                <div>
                  <p className="text-xl font-bold text-yellow-400">{summary.overdueCount || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{k:"summary",l:"Summary"},{k:"receivables",l:"Receivables"},{k:"payables",l:"Payables"}].map(t => (
          <Button key={t.k} size="sm" variant={tab === t.k ? "default" : "outline"} onClick={() => setTab(t.k as any)}
            className={tab === t.k ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {t.l}
          </Button>
        ))}
      </div>

      {/* Revenue Breakdown */}
      {tab === "summary" && revenue && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#1473FF]" />Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(revenue.categories || []).map((c: any) => (
                <div key={c.category} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                  <p className="text-[10px] text-slate-400 uppercase">{c.category}</p>
                  <p className="text-lg font-bold text-white">${Number(c.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{c.count} transactions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receivables List */}
      {tab === "receivables" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-green-400" />Accounts Receivable</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {receivablesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : receivables.length === 0 ? (
              <div className="p-8 text-center"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No receivables</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {receivables.map((r: any) => (
                  <div key={r.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{r.payeeName || `Payment #${r.id}`}</p>
                      <p className="text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-green-400 font-bold">${Number(r.amount || 0).toLocaleString()}</p>
                      <Badge className={cn("text-[9px]", STATUS_COLORS[r.status] || "bg-slate-500/20 text-slate-400")}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payables List */}
      {tab === "payables" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><ArrowDownLeft className="w-5 h-5 text-red-400" />Accounts Payable</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payablesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : payables.length === 0 ? (
              <div className="p-8 text-center"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No payables</p></div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {payables.map((p: any) => (
                  <div key={p.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{p.payerName || `Payment #${p.id}`}</p>
                      <p className="text-xs text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-red-400 font-bold">${Number(p.amount || 0).toLocaleString()}</p>
                      <Badge className={cn("text-[9px]", STATUS_COLORS[p.status] || "bg-slate-500/20 text-slate-400")}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
