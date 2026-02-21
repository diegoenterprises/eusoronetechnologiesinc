/**
 * CLAIMS — Cargo Claims & Disputes Management
 * File claims, track status, upload evidence.
 * 100% Dynamic | Theme-aware | Brand gradient.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FileText, AlertTriangle, CheckCircle, Clock, DollarSign,
  Plus, Search, Eye, Send, X, Shield, Package
} from "lucide-react";

const CLAIM_TYPES = [
  { id: "damage", label: "Cargo Damage", icon: AlertTriangle, color: "text-orange-500" },
  { id: "shortage", label: "Shortage", icon: Package, color: "text-yellow-500" },
  { id: "loss", label: "Total Loss", icon: X, color: "text-red-500" },
  { id: "delay", label: "Delay", icon: Clock, color: "text-blue-500" },
  { id: "contamination", label: "Contamination", icon: Shield, color: "text-purple-500" },
  { id: "other", label: "Other", icon: FileText, color: "text-slate-400" },
];

export default function Claims() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [tab, setTab] = useState<"list" | "file">("list");
  const [form, setForm] = useState({ loadId: "", type: "damage", amount: "", description: "" });

  const listQ = (trpc as any).claims?.list?.useQuery?.({ limit: 20 }) || { data: null, isLoading: false, refetch: () => {} };
  const summaryQ = (trpc as any).claims?.getSummary?.useQuery?.() || { data: null, isLoading: false };

  const fileMut = (trpc as any).claims?.file?.useMutation?.({
    onSuccess: (d: any) => { toast.success(`Claim ${d.claimNumber} filed`); setForm({ loadId: "", type: "damage", amount: "", description: "" }); setTab("list"); listQ.refetch?.(); summaryQ.refetch?.(); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  }) || { mutate: () => toast.error("Unavailable"), isPending: false };

  const claims = listQ.data?.claims || [];
  const summary = summaryQ.data;
  const ld = listQ.isLoading || summaryQ.isLoading;

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { submitted: "bg-blue-500/15 text-blue-500", under_review: "bg-yellow-500/15 text-yellow-500", investigating: "bg-purple-500/15 text-purple-500", approved: "bg-green-500/15 text-green-500", denied: "bg-red-500/15 text-red-500", settled: "bg-emerald-500/15 text-emerald-500", closed: "bg-slate-500/15 text-slate-400" };
    return <Badge className={cn("border-0 text-[10px] font-bold uppercase", m[s] || "bg-slate-500/15 text-slate-400")}>{s?.replace(/_/g, " ") || "Unknown"}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Claims</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Shield className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Disputes</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>File and manage cargo claims & disputes</p>
        </div>
        <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setTab("file")}>
          <Plus className="w-4 h-4 mr-1.5" />File Claim
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: "Total", v: summary?.total || 0, I: FileText, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
          { l: "Open", v: summary?.open || 0, I: Clock, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
          { l: "Resolved", v: summary?.resolved || 0, I: CheckCircle, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
          { l: "Pending", v: summary?.pending || 0, I: AlertTriangle, c: "text-orange-500", b: "from-orange-500/10 to-orange-600/5" },
        ].map((s: any) => (
          <div key={s.l} className={cn("rounded-2xl p-3.5 bg-gradient-to-br border", L ? `${s.b} border-slate-200/60` : `${s.b} border-slate-700/30`)}>
            <s.I className={cn("w-4 h-4 mb-1.5", s.c)} />
            {ld ? <Skeleton className="h-7 w-10 rounded-lg" /> : <p className={cn("text-2xl font-bold tracking-tight", s.c)}>{s.v}</p>}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-white/[0.03]")}>
        {([{ id: "list" as const, l: "All Claims", I: FileText }, { id: "file" as const, l: "File New", I: Plus }]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500" : "text-slate-400"
          )}><t.I className="w-3.5 h-3.5" />{t.l}</button>
        ))}
      </div>

      {/* Claims List */}
      {tab === "list" && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <FileText className="w-4 h-4 text-blue-500" />
            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Claims History</span>
            <span className="text-[10px] text-slate-400 ml-auto">{claims.length} total</span>
          </div>
          <CardContent className="p-0">
            {listQ.isLoading ? <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            : claims.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className={cn("font-medium", L ? "text-slate-600" : "text-slate-300")}>No claims filed</p>
                <p className="text-sm text-slate-400 mt-1">File your first claim if you have a dispute</p>
                <Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setTab("file")}>
                  <Plus className="w-4 h-4 mr-2" />File Claim
                </Button>
              </div>
            ) : (
              <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/20")}>
                {claims.map((c: any) => (
                  <div key={c.id} className={cn("px-4 py-3.5 transition-colors", L ? "hover:bg-slate-50" : "hover:bg-white/[0.04]")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{c.claimNumber}</p>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-xs text-slate-400">{c.type?.replace(/_/g, " ")} — {c.filedDate}</p>
                        {c.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{c.description}</p>}
                      </div>
                      {c.amount > 0 && <p className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>${c.amount.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File New Claim */}
      {tab === "file" && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <Plus className="w-4 h-4 text-blue-500" />
            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>File New Claim</span>
          </div>
          <CardContent className="p-4 space-y-4">
            <Input placeholder="Load ID" value={form.loadId} onChange={(e: any) => setForm({...form, loadId: e.target.value})} className="rounded-xl" />

            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium uppercase tracking-wider">Claim Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLAIM_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm({...form, type: t.id})}
                    className={cn("p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2",
                      form.type === t.id ? "border-blue-500 bg-blue-500/10" : L ? "border-slate-200 hover:border-blue-300" : "border-white/[0.06] hover:border-blue-500/30"
                    )}>
                    <t.icon className={cn("w-4 h-4", t.color)} />
                    <span className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-200")}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input type="number" placeholder="Claim Amount ($)" value={form.amount} onChange={(e: any) => setForm({...form, amount: e.target.value})} className="rounded-xl" />

            <Textarea placeholder="Describe the issue in detail..." value={form.description} onChange={(e: any) => setForm({...form, description: e.target.value})} rows={4} className={cn("rounded-xl", L ? "" : "bg-white/[0.02] border-white/[0.06]")} />

            <Button className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold"
              disabled={!form.loadId || !form.amount || !form.description || fileMut.isPending}
              onClick={() => fileMut.mutate({ loadId: form.loadId, type: form.type, amount: Number(form.amount), description: form.description })}>
              {fileMut.isPending ? "Filing..." : "Submit Claim"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
