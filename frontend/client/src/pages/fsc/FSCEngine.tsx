import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Fuel, Plus, RefreshCw, X, Calculator, History, Link,
  TrendingUp, Zap, ChevronRight, Eye, Settings,
} from "lucide-react";

const METHOD_LABELS: Record<string, string> = { cpm: "CPM", percentage: "Percentage", table: "Table Lookup" };
const PADD_LABELS: Record<string, string> = { "1A": "PADD 1A (New England)", "1B": "PADD 1B (Central Atlantic)", "1C": "PADD 1C (Lower Atlantic)", "2": "PADD 2 (Midwest)", "3": "PADD 3 (Gulf Coast)", "4": "PADD 4 (Rocky Mountain)", "5": "PADD 5 (West Coast)" };

export default function FSCEngine() {
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [previewDist, setPreviewDist] = useState(500);
  const [previewCost, setPreviewCost] = useState(5000);
  const [previewPadd, setPreviewPadd] = useState(3.5);

  const [form, setForm] = useState({
    scheduleName: "", method: "cpm" as string, paddRegion: "3" as string,
    fuelType: "diesel", basePrice: 0, cpmRate: 0.04, percentageRate: 2,
    tableEntries: [{ fuelPriceMin: 3.0, fuelPriceMax: 3.5, surchargeAmount: 0.15 }] as any[],
  });

  const schedulesQuery = (trpc as any).fscEngine.getSchedules.useQuery({}, { refetchInterval: 30000 });
  const schedules: any[] = schedulesQuery.data?.schedules || [];

  const createMut = (trpc as any).fscEngine.createSchedule.useMutation({
    onSuccess: () => { toast.success("FSC Schedule created"); setShowCreate(false); setCreateStep(1); schedulesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePaddMut = (trpc as any).fscEngine.updatePaddPrices.useMutation({
    onSuccess: (data: any) => { toast.success(`Updated ${data.updatedCount} schedules`); schedulesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const previewQuery = (trpc as any).fscEngine.getSchedulePreview.useQuery(
    { scheduleId: previewId!, distance: previewDist, estimatedCost: previewCost, paddPrice: previewPadd },
    { enabled: !!previewId }
  );

  const historyQuery = (trpc as any).fscEngine.getFSCHistory.useQuery(
    { scheduleId: historyId! },
    { enabled: !!historyId }
  );

  const addTableRow = () => {
    const last = form.tableEntries[form.tableEntries.length - 1];
    setForm(prev => ({
      ...prev,
      tableEntries: [...prev.tableEntries, { fuelPriceMin: last?.fuelPriceMax || 0, fuelPriceMax: (last?.fuelPriceMax || 0) + 0.5, surchargeAmount: 0 }],
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Fuel className="w-5 h-5 text-orange-400" />
          <h1 className="text-lg font-bold">FSC Engine</h1>
          <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs">WS-DC-005</Badge>
          <span className="text-xs text-slate-500">{schedules.length} schedules</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => schedulesQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5", schedulesQuery.isFetching && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-400" onClick={() => updatePaddMut.mutate()} disabled={updatePaddMut.isPending}>
            <Zap className="w-3.5 h-3.5 mr-1" />{updatePaddMut.isPending ? "Updating..." : "Refresh PADD"}
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => { setShowCreate(true); setCreateStep(1); }}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Schedule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Schedule Cards */}
        {schedulesQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
            <Fuel className="w-10 h-10 mb-3 opacity-30" />No FSC schedules yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {schedules.map((s: any) => (
              <Card key={s.id} className="bg-white/[0.02] border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{s.scheduleName}</div>
                    <div className="text-[10px] text-slate-500">{PADD_LABELS[s.paddRegion] || `PADD ${s.paddRegion}`}</div>
                  </div>
                  <Badge className={cn("text-[10px] border-0", s.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400")}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-orange-500/5 border border-orange-500/10 py-1.5">
                    <div className="text-[10px] text-slate-500">Method</div>
                    <div className="text-xs font-bold text-orange-400">{METHOD_LABELS[s.method]}</div>
                  </div>
                  <div className="rounded bg-blue-500/5 border border-blue-500/10 py-1.5">
                    <div className="text-[10px] text-slate-500">Rate</div>
                    <div className="text-xs font-bold text-blue-400">
                      {s.method === "cpm" ? `$${Number(s.cpmRate || 0).toFixed(4)}/mi` :
                       s.method === "percentage" ? `${Number(s.percentageRate || 0)}%` : "Table"}
                    </div>
                  </div>
                  <div className="rounded bg-green-500/5 border border-green-500/10 py-1.5">
                    <div className="text-[10px] text-slate-500">PADD Price</div>
                    <div className="text-xs font-bold text-green-400">
                      {s.lastPaddPrice ? `$${Number(s.lastPaddPrice).toFixed(2)}` : "—"}
                    </div>
                  </div>
                </div>

                {s.lastUpdateAt && (
                  <div className="text-[10px] text-slate-500">Last updated: {new Date(s.lastUpdateAt).toLocaleDateString()}</div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-cyan-400" onClick={() => setPreviewId(previewId === s.id ? null : s.id)}>
                    <Calculator className="w-3 h-3 mr-0.5" />Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-amber-400" onClick={() => setHistoryId(historyId === s.id ? null : s.id)}>
                    <History className="w-3 h-3 mr-0.5" />History
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Schedule Wizard */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New FSC Schedule — Step {createStep}/4</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={cn("flex-1 h-1 rounded-full", createStep >= n ? "bg-orange-500" : "bg-white/[0.06]")} />
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {createStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase mb-1 block">Schedule Name</label>
                  <Input value={form.scheduleName} onChange={e => setForm(p => ({ ...p, scheduleName: e.target.value }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g. Gulf Coast Standard FSC" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase mb-1 block">PADD Region</label>
                  <select value={form.paddRegion} onChange={e => setForm(p => ({ ...p, paddRegion: e.target.value }))} className="w-full h-8 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded px-2">
                    {Object.entries(PADD_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-slate-900">{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase mb-1 block">Fuel Type</label>
                  <Input value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                </div>
              </div>
            )}

            {/* Step 2: Method Selection */}
            {createStep === 2 && (
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Calculation Method</label>
                {(["cpm", "percentage", "table"] as const).map(m => (
                  <div key={m} className={cn("p-3 rounded-lg border cursor-pointer transition-all", form.method === m ? "border-orange-500/50 bg-orange-500/10" : "border-white/[0.06] hover:border-white/[0.12]")} onClick={() => setForm(p => ({ ...p, method: m }))}>
                    <div className="text-xs font-semibold text-white">{METHOD_LABELS[m]}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m === "cpm" ? "Cents per mile — distance × rate / 100" :
                       m === "percentage" ? "Percentage of estimated cost" :
                       "Lookup table based on current PADD fuel price"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Rate Configuration */}
            {createStep === 3 && (
              <div className="space-y-3">
                {form.method === "cpm" && (
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">CPM Rate ($/mile)</label>
                    <Input type="number" step="0.01" value={form.cpmRate} onChange={e => setForm(p => ({ ...p, cpmRate: Number(e.target.value) }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                    <div className="text-[10px] text-slate-500 mt-1">Example: 0.04 = $0.04/mile → 500 mi = $20 FSC</div>
                  </div>
                )}
                {form.method === "percentage" && (
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Percentage Rate (%)</label>
                    <Input type="number" step="0.1" value={form.percentageRate} onChange={e => setForm(p => ({ ...p, percentageRate: Number(e.target.value) }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                    <div className="text-[10px] text-slate-500 mt-1">Example: 2% of $5000 = $100 FSC</div>
                  </div>
                )}
                {form.method === "table" && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Fuel Price Ranges</label>
                    {form.tableEntries.map((te: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <Input type="number" step="0.01" value={te.fuelPriceMin} onChange={e => { const nt = [...form.tableEntries]; nt[i].fuelPriceMin = Number(e.target.value); setForm(p => ({ ...p, tableEntries: nt })); }} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="Min" />
                        <Input type="number" step="0.01" value={te.fuelPriceMax} onChange={e => { const nt = [...form.tableEntries]; nt[i].fuelPriceMax = Number(e.target.value); setForm(p => ({ ...p, tableEntries: nt })); }} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="Max" />
                        <Input type="number" step="0.01" value={te.surchargeAmount} onChange={e => { const nt = [...form.tableEntries]; nt[i].surchargeAmount = Number(e.target.value); setForm(p => ({ ...p, tableEntries: nt })); }} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="FSC" />
                        <button onClick={() => { const nt = form.tableEntries.filter((_: any, j: number) => j !== i); setForm(p => ({ ...p, tableEntries: nt })); }} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-orange-400" onClick={addTableRow}>+ Add Range</Button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-slate-500 uppercase mb-1 block">Base Price (optional)</label>
                  <Input type="number" step="0.01" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: Number(e.target.value) }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {createStep === 4 && (
              <div className="space-y-3">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Name:</span><span className="text-white">{form.scheduleName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">PADD Region:</span><span className="text-white">{PADD_LABELS[form.paddRegion]}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Method:</span><span className="text-orange-400">{METHOD_LABELS[form.method]}</span></div>
                  {form.method === "cpm" && <div className="flex justify-between"><span className="text-slate-500">CPM Rate:</span><span className="text-white">${form.cpmRate}/mi</span></div>}
                  {form.method === "percentage" && <div className="flex justify-between"><span className="text-slate-500">Pct Rate:</span><span className="text-white">{form.percentageRate}%</span></div>}
                  {form.method === "table" && <div className="flex justify-between"><span className="text-slate-500">Table Rows:</span><span className="text-white">{form.tableEntries.length}</span></div>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              {createStep > 1 ? (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCreateStep(s => s - 1)}>Back</Button>
              ) : <div />}
              {createStep < 4 ? (
                <Button size="sm" className="h-8 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => setCreateStep(s => s + 1)}>
                  Next<ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button size="sm" className="h-8 px-4 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
                  {createMut.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewId && previewQuery.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setPreviewId(null)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-400" />FSC Preview</h3>
              <button onClick={() => setPreviewId(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block">Distance (mi)</label>
                <Input type="number" value={previewDist} onChange={e => setPreviewDist(Number(e.target.value))} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase block">Est. Cost ($)</label>
                <Input type="number" value={previewCost} onChange={e => setPreviewCost(Number(e.target.value))} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 uppercase block">PADD Price ($)</label>
                <Input type="number" step="0.01" value={previewPadd} onChange={e => setPreviewPadd(Number(e.target.value))} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
            </div>
            <div className="text-center py-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-[10px] text-slate-500 uppercase">Calculated FSC</div>
              <div className="text-2xl font-bold text-orange-400">${previewQuery.data.fsc.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-1">{previewQuery.data.method.toUpperCase()} · PADD ${previewQuery.data.paddPrice}</div>
            </div>
            {previewQuery.data.calculations?.formula && (
              <div className="text-[10px] text-slate-400 text-center">{previewQuery.data.calculations.formula}</div>
            )}
          </Card>
        </div>
      )}

      {/* History Modal */}
      {historyId && historyQuery.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setHistoryId(null)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-96 max-h-80 overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" />FSC History — {historyQuery.data.scheduleName}</h3>
              <button onClick={() => setHistoryId(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="text-xs text-slate-400">{historyQuery.data.method.toUpperCase()} · {PADD_LABELS[historyQuery.data.paddRegion]}</div>
            {historyQuery.data.history.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No history recorded yet</div>
            ) : (
              <div className="space-y-2">
                {historyQuery.data.history.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] text-xs">
                    <span className="text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400">PADD ${h.paddPrice.toFixed(2)}</span>
                      <span className="text-orange-400">FSC ${h.calculatedFsc.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs shrink-0">
        <div className="flex gap-4 text-slate-400">
          {Object.entries(schedules.reduce((acc: Record<string, number>, s: any) => { acc[s.method] = (acc[s.method] || 0) + 1; return acc; }, {})).map(([m, c]) => (
            <span key={m}><span className="text-orange-400 font-medium">{c as number}</span> {METHOD_LABELS[m]}</span>
          ))}
        </div>
        <div className="text-slate-400">{schedules.length} schedule{schedules.length !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
}
