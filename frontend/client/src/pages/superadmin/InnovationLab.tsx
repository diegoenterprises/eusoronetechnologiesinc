import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FlaskConical, Plus, Play, Pause, CheckCircle, AlertTriangle, BarChart3,
  Trash2, RefreshCw, X, Eye, TrendingUp, Users, Target, Beaker,
} from "lucide-react";

type ExpStatus = "draft" | "active" | "paused" | "completed";

const STATUS_COLORS: Record<ExpStatus, string> = {
  draft: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  completed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default function InnovationLab() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", hypothesisStatement: "",
    variants: [{ variantId: "control", name: "Control", config: {} }, { variantId: "treatment_a", name: "Treatment A", config: {} }],
    targetUserSegment: "all", minSampleSize: 100, startDate: new Date().toISOString().split("T")[0],
  });

  const listQ = (trpc as any).experiments?.list?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const detailQ = (trpc as any).experiments?.get?.useQuery?.({ id: selectedId! }, { enabled: !!selectedId }) || { data: null, isLoading: false };
  const createM = (trpc as any).experiments?.create?.useMutation?.({
    onSuccess: () => { toast.success("Experiment created"); setShowCreate(false); listQ.refetch?.(); },
    onError: () => toast.error("Failed to create experiment"),
  }) || { mutate: () => {}, isPending: false };
  const statusM = (trpc as any).experiments?.updateStatus?.useMutation?.({
    onSuccess: () => { toast.success("Status updated"); listQ.refetch?.(); },
  }) || { mutate: () => {} };
  const computeM = (trpc as any).experiments?.computeResults?.useMutation?.({
    onSuccess: (data: any) => { toast.success(`Computed ${data?.length || 0} results`); if (selectedId) detailQ.refetch?.(); },
  }) || { mutate: () => {}, isPending: false };
  const deleteM = (trpc as any).experiments?.delete?.useMutation?.({
    onSuccess: () => { toast.success("Experiment deleted"); setSelectedId(null); listQ.refetch?.(); },
  }) || { mutate: () => {} };

  const experiments = (listQ.data as any[]) || [];
  const detail = detailQ.data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-400" />Innovation Lab
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">{experiments.length} experiments · A/B testing framework with statistical analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.08] text-slate-400" onClick={() => listQ.refetch?.()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
          </Button>
          <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Experiment
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {(["draft", "active", "paused", "completed"] as const).map(s => {
          const count = experiments.filter((e: any) => e.status === s).length;
          return (
            <div key={s} className={cn("p-3 rounded-xl border", STATUS_COLORS[s])}>
              <span className="text-lg font-bold font-mono">{count}</span>
              <p className="text-[10px] capitalize mt-0.5 opacity-70">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Experiment List */}
      {listQ.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/[0.04]" />)}</div>
      ) : experiments.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-10 text-center">
            <Beaker className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">No Experiments Yet</p>
            <p className="text-[10px] text-slate-500 mt-1">Create your first A/B test to validate product hypotheses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {experiments.map((exp: any) => (
            <Card key={exp.id} className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer", selectedId === exp.id && "ring-1 ring-purple-500/30")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0" onClick={() => setSelectedId(selectedId === exp.id ? null : exp.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{exp.name}</span>
                      <Badge className={cn("text-[9px]", STATUS_COLORS[exp.status as ExpStatus])}>{exp.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{exp.hypothesisStatement}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-slate-600"><Users className="w-3 h-3 inline mr-0.5" />{exp.targetUserSegment}</span>
                      <span className="text-[9px] text-slate-600"><Target className="w-3 h-3 inline mr-0.5" />Min {exp.minSampleSize} samples</span>
                      <span className="text-[9px] text-slate-600">{(exp.variants || []).length} variants</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    {exp.status === "draft" && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-emerald-400 hover:bg-emerald-500/10" onClick={() => statusM.mutate({ id: exp.id, status: "active" })}>
                        <Play className="w-3 h-3 mr-0.5" />Start
                      </Button>
                    )}
                    {exp.status === "active" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-amber-400 hover:bg-amber-500/10" onClick={() => statusM.mutate({ id: exp.id, status: "paused" })}>
                          <Pause className="w-3 h-3 mr-0.5" />Pause
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-blue-400 hover:bg-blue-500/10" onClick={() => computeM.mutate({ experimentId: exp.id })}>
                          <BarChart3 className="w-3 h-3 mr-0.5" />Compute
                        </Button>
                      </>
                    )}
                    {exp.status === "paused" && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-emerald-400 hover:bg-emerald-500/10" onClick={() => statusM.mutate({ id: exp.id, status: "active" })}>
                        <Play className="w-3 h-3 mr-0.5" />Resume
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-cyan-400 hover:bg-cyan-500/10" onClick={() => setSelectedId(exp.id)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] text-red-400 hover:bg-red-500/10" onClick={() => { if (confirm("Delete this experiment?")) deleteM.mutate({ id: exp.id }); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedId && detail && (
        <Card className="bg-slate-800/50 border-purple-500/20 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />Results: {detail.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variant Assignment Counts */}
            <div>
              <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Variant Assignments</p>
              <div className="flex gap-2">
                {(detail.variants || []).map((v: any) => (
                  <div key={v.variantId} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex-1 text-center">
                    <p className="text-xs font-semibold text-white">{v.name}</p>
                    <p className="text-lg font-bold font-mono text-purple-400">{detail.assignmentCounts?.[v.variantId] || 0}</p>
                    <p className="text-[9px] text-slate-500">users</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Table */}
            {detail.results && detail.results.length > 0 ? (
              <div>
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Statistical Results</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-slate-500">
                        <th className="text-left py-1.5 px-2">Variant</th>
                        <th className="text-left py-1.5 px-2">Metric</th>
                        <th className="text-right py-1.5 px-2">Mean</th>
                        <th className="text-right py-1.5 px-2">Samples</th>
                        <th className="text-right py-1.5 px-2">95% CI</th>
                        <th className="text-right py-1.5 px-2">p-value</th>
                        <th className="text-center py-1.5 px-2">Sig?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.results.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-white/[0.03]">
                          <td className="py-1.5 px-2 text-white font-semibold">{r.variantId}</td>
                          <td className="py-1.5 px-2 text-slate-400">{r.metricName}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-white">{Number(r.mean).toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-300">{r.sampleSize}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-400">
                            [{Number(r.confidenceIntervalLow).toFixed(2)}, {Number(r.confidenceIntervalHigh).toFixed(2)}]
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-300">{Number(r.pValue).toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-center">
                            {r.isSignificant ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 text-center py-4">No results computed yet. Click "Compute" to run statistical analysis.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><FlaskConical className="w-4 h-4 text-purple-400" />New Experiment</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
                <Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Dynamic Pricing Test" className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Hypothesis</label>
                <textarea value={form.hypothesisStatement} onChange={(e) => setForm({ ...form, hypothesisStatement: e.target.value })} placeholder="If we implement X, then Y will increase by Z%" className="w-full h-16 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded-md px-3 py-2 mt-1 resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Variants ({form.variants.length}/5)</label>
                {form.variants.map((v, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input value={v.name} onChange={(e: any) => { const nv = [...form.variants]; nv[i] = { ...nv[i], name: e.target.value }; setForm({ ...form, variants: nv }); }} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white flex-1" />
                    {form.variants.length > 2 && (
                      <button onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                ))}
                {form.variants.length < 5 && (
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] text-purple-400 mt-1" onClick={() => {
                    const id = `treatment_${String.fromCharCode(97 + form.variants.length - 1)}`;
                    setForm({ ...form, variants: [...form.variants, { variantId: id, name: `Treatment ${String.fromCharCode(65 + form.variants.length - 1)}`, config: {} }] });
                  }}><Plus className="w-3 h-3 mr-0.5" />Add Variant</Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Target Segment</label>
                  <select value={form.targetUserSegment} onChange={(e) => setForm({ ...form, targetUserSegment: e.target.value })} className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded-md px-2 mt-1">
                    <option value="all">All Users</option>
                    <option value="all_drivers">All Drivers</option>
                    <option value="carriers_na">Carriers (NA)</option>
                    <option value="shippers_eu">Shippers (EU)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">Min Sample Size</label>
                  <Input type="number" value={form.minSampleSize} onChange={(e: any) => setForm({ ...form, minSampleSize: parseInt(e.target.value) || 100 })} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
                </div>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs" disabled={createM.isPending || !form.name || !form.hypothesisStatement}
              onClick={() => createM.mutate({ ...form, variants: form.variants.map((v, i) => ({ ...v, variantId: i === 0 ? "control" : `treatment_${String.fromCharCode(97 + i - 1)}` })) })}>
              {createM.isPending ? "Creating..." : "Create Experiment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
