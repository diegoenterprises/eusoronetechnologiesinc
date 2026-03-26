import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BookOpen, Plus, Download, Upload, RefreshCw, Search, X,
  History, Eye, EyeOff, Pencil, Check, DollarSign, ArrowUpDown,
  FileSpreadsheet, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";

const RATE_TYPE_LABELS: Record<string, string> = {
  per_mile: "Per Mile",
  flat: "Flat Rate",
  per_barrel: "Per Barrel",
  per_gallon: "Per Gallon",
  per_ton: "Per Ton",
};

export default function Pricebook() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [historyEntryId, setHistoryEntryId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");

  const [form, setForm] = useState({
    entryName: "", originCity: "", originState: "", originTerminalId: 0,
    destinationCity: "", destinationState: "", destinationTerminalId: 0,
    cargoType: "", hazmatClass: "", rateType: "per_barrel" as string,
    rate: 0, fscIncluded: false, minimumCharge: 0,
    effectiveDate: new Date().toISOString().split("T")[0], expirationDate: "",
  });

  const entriesQuery = (trpc as any).pricebook.getEntries.useQuery(
    { isActive: activeOnly || undefined },
    { refetchInterval: 30000 }
  );
  const allEntries: any[] = entriesQuery.data?.entries || [];
  const entries = allEntries.filter((e: any) =>
    !search || e.entryName?.toLowerCase().includes(search.toLowerCase()) ||
    e.cargoType?.toLowerCase().includes(search.toLowerCase()) ||
    e.originCity?.toLowerCase().includes(search.toLowerCase()) ||
    e.destinationCity?.toLowerCase().includes(search.toLowerCase())
  );

  const createMut = (trpc as any).pricebook.createEntry.useMutation({
    onSuccess: () => { toast.success("Rate entry created"); setShowCreate(false); entriesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = (trpc as any).pricebook.updateEntry.useMutation({
    onSuccess: () => { toast.success("Rate updated"); setEditingId(null); entriesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deactivateMut = (trpc as any).pricebook.deactivateEntry.useMutation({
    onSuccess: () => { toast.success("Entry deactivated"); entriesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const importMut = (trpc as any).pricebook.importRates.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Imported ${data.importedCount}, failed ${data.failedCount}`);
      setShowImport(false);
      setImportCsv("");
      entriesQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportQuery = (trpc as any).pricebook.exportRates.useQuery(
    { isActive: activeOnly || undefined },
    { enabled: false }
  );

  const historyQuery = (trpc as any).pricebook.getRateHistory.useQuery(
    { entryId: historyEntryId! },
    { enabled: !!historyEntryId }
  );

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (result.data?.csv) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.data.fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-bold">Pricebook</h1>
          <span className="text-xs text-slate-500">{entries.length} entries</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rates..."
              className="h-7 w-48 pl-7 text-xs bg-white/[0.04] border-white/[0.08] text-white"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setActiveOnly(!activeOnly)}>
            {activeOnly ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
            {activeOnly ? "Active" : "All"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => entriesQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5", entriesQuery.isFetching && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-400" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1" />Export
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-400" onClick={() => setShowImport(!showImport)}>
            <Upload className="w-3.5 h-3.5 mr-1" />Import
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-purple-400" onClick={() => navigate("/bulk-upload?type=rates")}>
            <Upload className="w-3.5 h-3.5 mr-1" />Bulk Import Rates
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Rate
          </Button>
        </div>
      </div>

      {/* CSV Import Panel */}
      {showImport && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-slate-900/80 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white">Import CSV</h3>
            <button onClick={() => setShowImport(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <textarea
            value={importCsv}
            onChange={e => setImportCsv(e.target.value)}
            placeholder="Paste CSV text here..."
            className="w-full h-24 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded p-2 resize-none"
          />
          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
            onClick={() => importMut.mutate({ csvText: importCsv })} disabled={!importCsv || importMut.isPending}>
            {importMut.isPending ? "Importing..." : "Import Rates"}
          </Button>
        </div>
      )}

      {/* Create Panel */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Rate Entry</h3>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: "Entry Name", key: "entryName", type: "text" },
              { label: "Origin City", key: "originCity", type: "text" },
              { label: "Origin State", key: "originState", type: "text" },
              { label: "Dest City", key: "destinationCity", type: "text" },
              { label: "Dest State", key: "destinationState", type: "text" },
              { label: "Cargo Type", key: "cargoType", type: "text" },
              { label: "Rate Type", key: "rateType", type: "text" },
              { label: "Rate ($)", key: "rate", type: "number" },
              { label: "Min Charge ($)", key: "minimumCharge", type: "number" },
              { label: "Effective Date", key: "effectiveDate", type: "date" },
              { label: "Expiration Date", key: "expirationDate", type: "date" },
              { label: "Hazmat Class", key: "hazmatClass", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-500 uppercase mb-1 block">{f.label}</label>
                <Input
                  type={f.type}
                  value={(form as any)[f.key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
            ))}
          </div>
          <Button size="sm" className="h-8 px-4 text-xs bg-amber-600 hover:bg-amber-700" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
            {createMut.isPending ? "Creating..." : "Create Entry"}
          </Button>
        </div>
      )}

      {/* Rate Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06] bg-slate-900">
              <th className="px-3 py-2 text-left">Entry Name</th>
              <th className="px-3 py-2 text-left">Origin</th>
              <th className="px-3 py-2 text-left">Destination</th>
              <th className="px-3 py-2 text-left">Cargo</th>
              <th className="px-3 py-2 text-left">Hazmat</th>
              <th className="px-3 py-2 text-left">Rate Type</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Min Charge</th>
              <th className="px-3 py-2 text-left">Effective</th>
              <th className="px-3 py-2 text-left">Expires</th>
              <th className="px-3 py-2 text-left">FSC</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entriesQuery.isLoading ? (
              <tr><td colSpan={12} className="px-3 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-12 text-center text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />No rate entries found
              </td></tr>
            ) : entries.map((e: any) => (
              <tr key={e.id} className={cn("border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors", !e.isActive && "opacity-50")}>
                <td className="px-3 py-2 font-medium text-white">{e.entryName}</td>
                <td className="px-3 py-2 text-slate-300">
                  {e.originCity ? `${e.originCity}, ${e.originState || ""}` : e.originTerminalId ? `Terminal #${e.originTerminalId}` : "—"}
                </td>
                <td className="px-3 py-2 text-slate-300">
                  {e.destinationCity ? `${e.destinationCity}, ${e.destinationState || ""}` : e.destinationTerminalId ? `Terminal #${e.destinationTerminalId}` : "—"}
                </td>
                <td className="px-3 py-2">
                  {e.cargoType ? <Badge className="bg-amber-500/10 text-amber-400 border-0 text-xs">{e.cargoType}</Badge> : "—"}
                </td>
                <td className="px-3 py-2 text-slate-400">{e.hazmatClass || "—"}</td>
                <td className="px-3 py-2">
                  <Badge className="bg-blue-500/10 text-blue-400 border-0 text-xs">{RATE_TYPE_LABELS[e.rateType] || e.rateType}</Badge>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {editingId === e.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Input
                        type="number"
                        value={editRate}
                        onChange={ev => setEditRate(ev.target.value)}
                        className="h-6 w-20 text-xs bg-white/[0.08] border-white/[0.12] text-white text-right"
                        autoFocus
                      />
                      <button onClick={() => updateMut.mutate({ entryId: e.id, rate: Number(editRate) })} className="text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => { setEditingId(e.id); setEditRate(String(Number(e.rate))); }}>
                      ${Number(e.rate).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-slate-400">{e.minimumCharge ? `$${Number(e.minimumCharge).toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2 text-slate-300">{e.effectiveDate || "—"}</td>
                <td className="px-3 py-2 text-slate-300">{e.expirationDate || "—"}</td>
                <td className="px-3 py-2">{e.fscIncluded ? <Badge className="bg-green-500/10 text-green-400 border-0 text-xs">Yes</Badge> : <span className="text-slate-500">No</span>}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setHistoryEntryId(historyEntryId === e.id ? null : e.id)} className="text-slate-400 hover:text-white p-0.5">
                      <History className="w-3.5 h-3.5" />
                    </button>
                    {e.isActive ? (
                      <button onClick={() => deactivateMut.mutate({ entryId: e.id })} className="text-slate-400 hover:text-red-400 p-0.5">
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rate History Modal */}
      {historyEntryId && historyQuery.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setHistoryEntryId(null)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-96 max-h-80 overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />Rate History — {historyQuery.data.entryName}
              </h3>
              <button onClick={() => setHistoryEntryId(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="text-xs text-slate-400">Current rate: <span className="text-emerald-400 font-semibold">${Number(historyQuery.data.currentRate).toFixed(2)}</span></div>
            {historyQuery.data.history.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No rate changes recorded</div>
            ) : (
              <div className="space-y-2">
                {historyQuery.data.history.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] text-xs">
                    <span className="text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">${Number(h.previousRate).toFixed(2)}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400">${Number(h.newRate).toFixed(2)}</span>
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
        <div className="text-slate-400">
          {entries.length} rate{entries.length !== 1 ? "s" : ""} · {activeOnly ? "active only" : "all entries"}
        </div>
        <div className="flex gap-3 text-slate-400">
          {Object.entries(entries.reduce((acc: Record<string, number>, e: any) => { acc[e.rateType] = (acc[e.rateType] || 0) + 1; return acc; }, {})).map(([type, count]) => (
            <span key={type}><span className="text-amber-400 font-medium">{count as number}</span> {RATE_TYPE_LABELS[type] || type}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
