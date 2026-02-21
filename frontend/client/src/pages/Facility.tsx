/**
 * TERMINAL PROFILE
 * Jony Ive design language — every element intentional, every pixel purposeful.
 *
 * Tabs: Overview | Compliance | Operations | SpectraMatch | Partnerships
 *
 * This is the terminal's face to the world. Counterparties (shippers,
 * marketers, brokers, transporters) see this profile and understand the
 * terminal's capabilities, compliance posture, operational capacity,
 * product verification technology, and partnership ecosystem.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, MapPin, CheckCircle, Activity,
  Droplets, Gauge, Edit, Save, X, Globe, Phone, Mail, Handshake,
  AlertTriangle, Container, Layers, ArrowRight, Beaker, Target,
  TrendingUp, BarChart3, CircleDot, Workflow, FileText, Clock,
  XCircle, Upload, Truck, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EsangIcon } from "@/components/EsangIcon";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, { icon: any; cls: string; label: string }> = {
  VERIFIED:       { icon: CheckCircle,   cls: "text-emerald-400 bg-emerald-400/10", label: "Verified" },
  UPLOADED:       { icon: Upload,        cls: "text-blue-400 bg-blue-400/10",       label: "Uploaded" },
  PENDING_REVIEW: { icon: Clock,         cls: "text-amber-400 bg-amber-400/10",     label: "Pending" },
  EXPIRING_SOON:  { icon: AlertTriangle, cls: "text-amber-400 bg-amber-400/10",     label: "Expiring" },
  EXPIRED:        { icon: XCircle,       cls: "text-red-400 bg-red-400/10",         label: "Expired" },
  REJECTED:       { icon: XCircle,       cls: "text-red-400 bg-red-400/10",         label: "Rejected" },
  MISSING:        { icon: AlertTriangle, cls: "text-slate-500 bg-white/[0.03]",     label: "Missing" },
};

const TYPE_LABELS: Record<string, string> = {
  refinery: "Refinery", storage: "Storage Facility", rack: "Rack Terminal",
  pipeline: "Pipeline Hub", blending: "Blending Facility", distribution: "Distribution Center",
  marine: "Marine Terminal", rail: "Rail Terminal",
};

function Ring({ value, size = 88, stroke = 6, color = "#1473FF" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} className="transition-all duration-700" />
    </svg>
  );
}

export default function FacilityPage() {
  const [, navigate] = useLocation();
  const tabFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
  const [tab, setTab] = useState(tabFromUrl || "overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [compFilter, setCompFilter] = useState<string>("all");

  const utils = (trpc as any).useUtils();
  const pq = (trpc as any).terminals.getTerminalProfile.useQuery();
  const cq = (trpc as any).documentCenter?.getMyComplianceProfile?.useQuery?.() || { data: null, isLoading: false };
  const stq = (trpc as any).terminals?.getStats?.useQuery?.() || { data: null };
  const shipQ = (trpc as any).terminals?.getShipments?.useQuery?.({ date: new Date().toISOString().split("T")[0] }) || { data: null };
  const historyQ = (trpc as any).spectraMatch?.getHistory?.useQuery?.({ limit: 5 }) || { data: null };
  const learningQ = (trpc as any).spectraMatch?.getLearningStats?.useQuery?.() || { data: null };

  const saveMut = (trpc as any).terminals.updateTerminalProfile.useMutation({
    onSuccess: () => { toast.success("Profile saved"); utils.terminals.getTerminalProfile.invalidate(); utils.terminals?.getStats?.invalidate?.(); setEditing(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const d = pq.data;
  const t = d?.terminal;
  const co = d?.company;
  const partners = d?.partners || [];
  const stats = d?.stats || {};

  const startEdit = () => {
    setForm({ name: t?.name || "", code: t?.code || "", address: t?.address || "", city: t?.city || "", state: t?.state || "", terminalType: t?.terminalType || "storage", throughputCapacity: t?.throughputCapacity || 0, throughputUnit: t?.throughputUnit || "bbl/day", dockCount: t?.dockCount || 0, tankCount: t?.tankCount || 0, latitude: t?.latitude != null ? String(t.latitude) : "", longitude: t?.longitude != null ? String(t.longitude) : "" });
    setEditing(true);
  };

  const doSave = () => {
    if (!form) return;
    saveMut.mutate({ name: form.name || undefined, code: form.code || undefined, address: form.address || undefined, city: form.city || undefined, state: form.state || undefined, terminalType: form.terminalType || undefined, throughputCapacity: Number(form.throughputCapacity) || 0, throughputUnit: form.throughputUnit || "bbl/day", dockCount: Number(form.dockCount) || 0, tankCount: Number(form.tankCount) || 0, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null });
  };

  // Derived
  const activePartners = partners.filter((p: any) => p.status === "active");
  const totalVolume = partners.reduce((s: number, p: any) => s + (p.monthlyVolumeCommitment || 0), 0);
  const byType = partners.reduce((a: any, p: any) => { a[p.partnerType] = (a[p.partnerType] || 0) + 1; return a; }, {} as Record<string, number>);
  const byAccess = partners.reduce((a: any, p: any) => { a[p.rackAccessLevel || "scheduled"] = (a[p.rackAccessLevel || "scheduled"] || 0) + 1; return a; }, {} as Record<string, number>);
  const products = (t?.productsHandled || []) as string[];
  const capacity = t?.throughputCapacity ? Number(t.throughputCapacity) : 0;
  const docks = t?.dockCount || 0;
  const tanks = t?.tankCount || 0;
  const unit = t?.throughputUnit || "bbl/day";
  const infraNotConfigured = capacity === 0 && docks === 0 && tanks === 0;

  // Compliance — REAL engine data
  const compReqs = (cq.data?.requirements || []) as any[];
  const compScore = cq.data?.complianceScore || 0;
  const compStatus = cq.data?.documentStatus || {};
  const canOperate = cq.data?.canOperate !== false;
  const filteredReqs = compFilter === "all" ? compReqs : compReqs.filter((r: any) => r.docStatus === compFilter);
  const filteredGroups = filteredReqs.reduce((a: any, r: any) => { (a[r.group] = a[r.group] || []).push(r); return a; }, {} as Record<string, any[]>);

  // Operations — real stats
  const opsStats = stq.data || {};
  const shipments = (shipQ.data || []) as any[];

  // Cell style
  const cell = "rounded-2xl border border-white/[0.04] bg-white/[0.02]";
  const inp = "bg-white/[0.04] border-white/[0.06] rounded-xl text-white placeholder:text-slate-500";

  if (pq.isLoading) return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1200px] mx-auto">
      <Skeleton className="h-10 w-56 rounded-xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1200px] mx-auto">

      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Terminal Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t ? `${t.name}${t.code ? ` \u00B7 ${t.code}` : ""}` : "Configure your facility identity"}</p>
        </div>
        {!editing ? (
          <Button onClick={startEdit} size="sm" className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] shadow-none h-9 px-4 text-xs font-medium">
            <Edit className="w-3.5 h-3.5 mr-1.5" />Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(null); }} className="h-9 text-xs text-slate-400"><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
            <Button size="sm" onClick={doSave} disabled={saveMut.isPending} className="h-9 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-medium px-4">
              <Save className="w-3.5 h-3.5 mr-1.5" />{saveMut.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* ─── Identity ─── */}
      <div className={cn("p-6", cell)}>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-[#1473FF]" />
          </div>
          {editing ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Name</label><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} className={inp} /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Code</label><Input value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="HTN-01" className={inp} /></div>
              <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Type</label>
                <select value={form.terminalType} onChange={(e: any) => setForm({ ...form, terminalType: e.target.value })} className={cn("w-full px-3 py-2 text-sm h-10", inp)}>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </div>
              <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Status</label><div className="h-10 flex items-center"><span className="text-emerald-400 text-sm font-medium">{t?.status || "active"}</span></div></div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white tracking-tight">{t?.name || "No Terminal Registered"}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {t?.code && <span className="text-xs text-slate-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-md">{t.code}</span>}
                {t?.terminalType && <span className="text-xs text-slate-500">{TYPE_LABELS[t.terminalType] || t.terminalType}</span>}
                <span className="text-[10px] text-slate-600">|</span>
                <span className={cn("text-xs font-medium", t?.status === "active" ? "text-emerald-400" : "text-red-400")}>{(t?.status || "active").charAt(0).toUpperCase() + (t?.status || "active").slice(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none p-0 h-auto gap-0">
          {["overview", "compliance", "operations", "spectra-match", "partnerships"].map(v => (
            <TabsTrigger key={v} value={v} className={cn(
              "rounded-none border-b-2 border-transparent data-[state=active]:border-[#1473FF] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-1 text-xs font-medium transition-colors",
              "text-slate-500 data-[state=active]:text-white hover:text-slate-300"
            )}>
              {v === "spectra-match" ? "SpectraMatch" : v.charAt(0).toUpperCase() + v.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════════════════ OVERVIEW ════════════════ */}
        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Location */}
            <div className={cn("lg:col-span-3 p-6 space-y-5", cell)}>
              <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-[#1473FF]" /><span className="text-sm font-medium text-white">Location</span></div>
              {editing ? (
                <div className="space-y-3">
                  <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Address</label><Input value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} className={inp} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">City</label><Input value={form.city} onChange={(e: any) => setForm({ ...form, city: e.target.value })} className={inp} /></div>
                    <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">State</label><Input value={form.state} onChange={(e: any) => setForm({ ...form, state: e.target.value })} className={inp} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Lat</label><Input type="number" step="any" value={form.latitude} onChange={(e: any) => setForm({ ...form, latitude: e.target.value })} className={inp} /></div>
                    <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Lng</label><Input type="number" step="any" value={form.longitude} onChange={(e: any) => setForm({ ...form, longitude: e.target.value })} className={inp} /></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <Row label="Address" value={t?.address || "Not set"} />
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="City" value={t?.city || "---"} />
                    <Row label="State" value={t?.state || "---"} />
                  </div>
                  {(t?.latitude || t?.longitude) && <Row label="Coordinates" value={`${t?.latitude?.toFixed(6)}, ${t?.longitude?.toFixed(6)}`} mono />}
                </div>
              )}
              {/* Products */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Products Handled</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {products.length > 0 ? products.map((p: string) => (
                    <span key={p} className="text-[11px] text-[#1473FF] bg-[#1473FF]/10 px-2.5 py-1 rounded-lg font-medium">{p}</span>
                  )) : <span className="text-xs text-slate-600">No products configured</span>}
                </div>
              </div>
            </div>

            {/* Right: Company */}
            <div className={cn("lg:col-span-2 p-6 space-y-4", cell)}>
              <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium text-white">Company</span></div>
              <Row label="Name" value={co?.name || "---"} bold />
              {co?.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-slate-600" /><span className="text-slate-300">{co.phone}</span></div>}
              {co?.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-slate-600" /><span className="text-slate-300 truncate">{co.email}</span></div>}
              {co?.website && <div className="flex items-center gap-2 text-sm"><Globe className="w-3.5 h-3.5 text-slate-600" /><span className="text-[#1473FF]">{co.website}</span></div>}

              {/* Quick Stats */}
              <div className="pt-3 mt-3 border-t border-white/[0.04] grid grid-cols-2 gap-3">
                <Stat value={stats.appointmentsLast30 || 0} label="Appts (30d)" color="text-[#1473FF]" />
                <Stat value={`${stats.completionRate || 0}%`} label="Completion" color="text-emerald-400" />
                <Stat value={d?.staffCount || 0} label="Staff" color="text-slate-300" />
                <Stat value={partners.length} label="Partners" color="text-purple-400" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════ COMPLIANCE (REAL ENGINE) ════════════════ */}
        <TabsContent value="compliance" className="mt-8 space-y-6">
          {/* Score + Status Banner */}
          <div className={cn("p-6", cell)}>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative shrink-0">
                <Ring value={compScore} size={80} stroke={5} color={compScore >= 80 ? "#34d399" : compScore >= 50 ? "#fbbf24" : "#f87171"} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-lg font-bold", compScore >= 80 ? "text-emerald-400" : compScore >= 50 ? "text-amber-400" : "text-red-400")}>{compScore}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">Company Compliance</p>
                  {!canOperate && <span className="text-[9px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md font-semibold">BLOCKED</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {compReqs.length} requirements resolved based on your company profile, state, and operations.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">{compStatus.totalVerified || 0} Verified</span>
                  <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">{compStatus.totalPending || 0} Pending</span>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">{compStatus.totalExpiring || 0} Expiring</span>
                  {(compStatus.totalExpired || 0) > 0 && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">{compStatus.totalExpired} Expired</span>}
                  <span className="text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md">{compStatus.totalMissing || 0} Missing</span>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate("/documents")} className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] shadow-none h-9 px-4 text-xs font-medium shrink-0">
                <FileText className="w-3.5 h-3.5 mr-1.5" />Upload Documents
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: "all", label: `All ${compReqs.length}` },
              { key: "MISSING", label: `Missing ${compStatus.totalMissing || 0}` },
              { key: "EXPIRING_SOON", label: `Expiring ${compStatus.totalExpiring || 0}` },
              { key: "VERIFIED", label: `Verified ${compStatus.totalVerified || 0}` },
            ].map(f => (
              <button key={f.key} onClick={() => setCompFilter(f.key)} className={cn(
                "text-[10px] px-3 py-1.5 rounded-lg font-medium transition-colors",
                compFilter === f.key ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
              )}>{f.label}</button>
            ))}
          </div>

          {/* Grouped Requirements */}
          {Object.keys(filteredGroups).length === 0 ? (
            <div className={cn("p-8 text-center", cell)}>
              <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">No requirements match this filter</p>
            </div>
          ) : Object.entries(filteredGroups).map(([group, items]: any) => (
            <div key={group}>
              <div className="flex items-center justify-between mb-2 pl-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{group}</p>
                <span className="text-[10px] text-slate-600">{items.length}</span>
              </div>
              <div className={cn("divide-y divide-white/[0.03]", cell)}>
                {items.map((r: any) => {
                  const st = STATUS_STYLE[r.docStatus] || STATUS_STYLE.MISSING;
                  const Icon = st.icon;
                  return (
                    <div key={`${r.documentTypeId}-${r.stateCode || ""}`} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={cn("w-4 h-4 shrink-0", st.cls.split(" ")[0])} />
                        <div className="min-w-0">
                          <p className="text-[13px] text-white truncate">{r.name}</p>
                          {r.reason && <p className="text-[10px] text-slate-600 truncate mt-0.5">{r.reason}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.priority === "CRITICAL" && r.docStatus === "MISSING" && <span className="text-[9px] text-red-400 font-semibold">CRITICAL</span>}
                        {r.stateCode && <span className="text-[9px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{r.stateCode}</span>}
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", st.cls)}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ════════════════ OPERATIONS ════════════════ */}
        <TabsContent value="operations" className="mt-8 space-y-6">
          {/* Setup prompt when not configured */}
          {infraNotConfigured && !editing && (
            <div className={cn("p-6 border-dashed border-amber-500/30", cell)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Configure your facility infrastructure</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Set your throughput capacity, number of loading docks/racks, and storage tanks so counterparties can see your capabilities.
                  </p>
                  <Button size="sm" onClick={startEdit} className="mt-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 shadow-none h-8 px-3 text-xs font-medium">
                    <Edit className="w-3.5 h-3.5 mr-1.5" />Configure Infrastructure
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure */}
          <div className={cn("p-6", cell)}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Gauge className="w-4 h-4 text-[#1473FF]" /><span className="text-sm font-medium text-white">Infrastructure</span></div>
              {!editing && !infraNotConfigured && (
                <button onClick={startEdit} className="text-[10px] text-slate-500 hover:text-white transition-colors">Edit</button>
              )}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Capacity</label><Input type="number" value={form.throughputCapacity} onChange={(e: any) => setForm({ ...form, throughputCapacity: e.target.value })} className={inp} /></div>
                <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Unit</label>
                  <select value={form.throughputUnit} onChange={(e: any) => setForm({ ...form, throughputUnit: e.target.value })} className={cn("w-full px-3 py-2 text-sm h-10", inp)}>
                    <option value="bbl/day">bbl/day</option><option value="gal/day">gal/day</option><option value="tons/day">tons/day</option>
                  </select>
                </div>
                <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Docks / Racks</label><Input type="number" value={form.dockCount} onChange={(e: any) => setForm({ ...form, dockCount: e.target.value })} className={inp} /></div>
                <div><label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Tanks</label><Input type="number" value={form.tankCount} onChange={(e: any) => setForm({ ...form, tankCount: e.target.value })} className={inp} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{capacity > 0 ? capacity.toLocaleString() : "---"}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{unit}</p>
                </div>
                <div className="text-center">
                  <Container className="w-5 h-5 text-[#1473FF] mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{docks}</p>
                  <p className="text-[10px] text-slate-500">Docks / Racks</p>
                </div>
                <div className="text-center">
                  <Layers className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{tanks}</p>
                  <p className="text-[10px] text-slate-500">Storage Tanks</p>
                </div>
                <div className="text-center">
                  <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{d?.staffCount || 0}</p>
                  <p className="text-[10px] text-slate-500">Active Staff</p>
                </div>
              </div>
            )}
          </div>

          {/* Today's Activity + 30-Day Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-[#1473FF]" /><span className="text-sm font-medium text-white">Today's Activity</span></div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat value={opsStats.activeShipments || 0} label="Shipments" color="text-[#1473FF]" />
                <Stat value={opsStats.incomingToday || 0} label="Incoming" color="text-emerald-400" />
                <Stat value={opsStats.outgoingToday || 0} label="Outgoing" color="text-purple-400" />
              </div>
              {shipments.length > 0 ? (
                <div className="space-y-2 pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Recent</p>
                  {shipments.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        {s.type === "incoming" ? <Truck className="w-3.5 h-3.5 text-emerald-400" /> : <Package className="w-3.5 h-3.5 text-purple-400" />}
                        <span className="text-xs text-slate-300">{s.type === "incoming" ? "Inbound" : "Outbound"}</span>
                      </div>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md",
                        s.status === "completed" ? "text-emerald-400 bg-emerald-400/10" :
                        s.status === "loading" ? "text-blue-400 bg-blue-400/10" :
                        "text-slate-400 bg-white/[0.04]"
                      )}>{s.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-3 border-t border-white/[0.04] text-center py-4">
                  <p className="text-xs text-slate-600">No shipments today</p>
                </div>
              )}
            </div>

            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">30-Day Performance</span></div>
              <div className="space-y-4">
                <PerfRow label="Appointments" current={stats.completedLast30 || 0} total={stats.appointmentsLast30 || 0} pct={stats.completionRate || 0} color="#1473FF" />
                <PerfRow label="Partner Coverage" current={activePartners.length} total={partners.length || 1} pct={partners.length > 0 ? Math.round((activePartners.length / partners.length) * 100) : 0} color="#a855f7" />
                <PerfRow label="Compliance" current={compStatus.totalVerified || 0} total={compReqs.length || 1} pct={compScore} color={compScore >= 80 ? "#34d399" : compScore >= 50 ? "#fbbf24" : "#f87171"} />
                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-xs text-slate-500">Volume Committed</span>
                  <span className="text-sm font-semibold text-white">{totalVolume > 0 ? `${totalVolume.toLocaleString()} bbl/mo` : "---"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Mix */}
          {products.length > 0 && (
            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4"><Droplets className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium text-white">Product Mix</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {products.map((p, i) => (
                  <div key={p} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ["#1473FF", "#BE01FF", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"][i % 8] }} />
                    <span className="text-sm text-slate-300 truncate">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ════════════════ SPECTRA-MATCH ════════════════ */}
        <TabsContent value="spectra-match" className="mt-8 space-y-6">
          <div className={cn("p-6", cell)}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Product Verification</span>
              </div>
              <Badge className="bg-gradient-to-r from-[#BE01FF]/15 to-[#1473FF]/15 text-purple-300 border-0 text-[10px]">
                <EsangIcon className="w-3 h-3 mr-1" />ESANG AI
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Verify crude oil origin and quality at the loading rack. Results are saved to run tickets and visible to counterparties.
            </p>
            <SpectraMatchWidget compact={false} showSaveButton={true} onIdentify={(result: any) => toast.success(`Identified: ${result.primaryMatch.name} (${result.primaryMatch.confidence}%)`)} />
          </div>

          {/* Stats + History side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Stats */}
            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-[#1473FF]" /><span className="text-sm font-medium text-white">Identification Stats</span></div>
              <div className="grid grid-cols-3 gap-3">
                <Stat value={learningQ.data?.totalIdentifications || 0} label="Total IDs" color="text-[#1473FF]" />
                <Stat value={`${learningQ.data?.avgConfidence || 0}%`} label="Avg Confidence" color="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
                <Stat value={learningQ.data?.recentTrend === "Improving" ? "Up" : learningQ.data?.recentTrend === "Declining" ? "Down" : "---"} label="Trend" color={learningQ.data?.recentTrend === "Improving" ? "text-emerald-400" : "text-slate-500"} />
              </div>
              {learningQ.data?.topProducts?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Most Identified</p>
                  {learningQ.data.topProducts.slice(0, 3).map((p: any) => (
                    <div key={p.product} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-slate-300">{p.product}</span>
                      <span className="text-xs text-slate-500 font-mono">{p.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent History */}
            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium text-white">Recent Identifications</span></div>
              {(historyQ.data as any)?.identifications?.length > 0 ? (
                <div className="space-y-2">
                  {(historyQ.data as any).identifications.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                      <div>
                        <p className="text-sm text-white">{item.crudeType}</p>
                        <p className="text-[10px] text-slate-600">API {item.apiGravity} | BS&W {item.bsw}%</p>
                      </div>
                      <span className={cn("text-xs font-semibold", item.confidence >= 90 ? "text-emerald-400" : item.confidence >= 75 ? "text-amber-400" : "text-orange-400")}>{item.confidence}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Beaker className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No identifications yet</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════ PARTNERSHIPS ════════════════ */}
        <TabsContent value="partnerships" className="mt-8 space-y-6">
          {/* Value Chain Overview */}
          <div className={cn("p-6", cell)}>
            <div className="flex items-center gap-2 mb-5"><Workflow className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium text-white">Value Chain Position</span></div>
            {/* Flow visualization */}
            <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
              <ChainNode label="Producers" count={byType.shipper || 0} color="#1473FF" sub="Shippers" />
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <ChainNode label="Marketers" count={byType.marketer || 0} color="#a855f7" sub="Volume" />
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 border border-[#1473FF]/20 text-center">
                <p className="text-xs font-semibold text-white">{t?.name || "Your Terminal"}</p>
                <p className="text-[10px] text-slate-400">{TYPE_LABELS[t?.terminalType || "storage"]}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <ChainNode label="Transporters" count={byType.transporter || 0} color="#10b981" sub="Movement" />
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <ChainNode label="Brokers" count={byType.broker || 0} color="#f59e0b" sub="Markets" />
            </div>
          </div>

          {/* Aggregate Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn("p-5 text-center", cell)}>
              <p className="text-2xl font-bold text-white">{partners.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Total Partners</p>
            </div>
            <div className={cn("p-5 text-center", cell)}>
              <p className="text-2xl font-bold text-emerald-400">{activePartners.length}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Active</p>
            </div>
            <div className={cn("p-5 text-center", cell)}>
              <p className="text-2xl font-bold text-[#1473FF]">{totalVolume > 0 ? totalVolume.toLocaleString() : "---"}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">bbl/mo Committed</p>
            </div>
            <div className={cn("p-5 text-center", cell)}>
              <p className="text-2xl font-bold text-purple-400">{byAccess.full || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Full Access</p>
            </div>
          </div>

          {/* Partner Directory */}
          <div className={cn("divide-y divide-white/[0.03]", cell)}>
            {partners.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Handshake className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No partnerships yet</p>
                <p className="text-xs text-slate-600 mt-1">Add partners via Supply Chain to build your network</p>
              </div>
            ) : partners.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    p.partnerType === "shipper" ? "bg-[#1473FF]/10" : p.partnerType === "marketer" ? "bg-purple-500/10" : p.partnerType === "broker" ? "bg-amber-500/10" : "bg-emerald-500/10"
                  )}>
                    <Building2 className={cn("w-4 h-4",
                      p.partnerType === "shipper" ? "text-[#1473FF]" : p.partnerType === "marketer" ? "text-purple-400" : p.partnerType === "broker" ? "text-amber-400" : "text-emerald-400"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.companyName || `Company #${p.companyId}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">{p.partnerType}</span>
                      <CircleDot className={cn("w-2.5 h-2.5", p.status === "active" ? "text-emerald-400" : "text-amber-400")} />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-4">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md",
                    p.rackAccessLevel === "full" ? "text-emerald-400 bg-emerald-400/10" : p.rackAccessLevel === "limited" ? "text-amber-400 bg-amber-400/10" : "text-slate-400 bg-white/[0.04]"
                  )}>{(p.rackAccessLevel || "scheduled").charAt(0).toUpperCase() + (p.rackAccessLevel || "scheduled").slice(1)}</span>
                  {p.monthlyVolumeCommitment > 0 && (
                    <p className="text-[10px] text-slate-600 mt-1">{Number(p.monthlyVolumeCommitment).toLocaleString()} bbl/mo</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Sub-components ─── */
function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <p className={cn("text-sm mt-0.5", bold ? "text-white font-semibold" : "text-slate-300", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function InfraCard({ icon, value, label, sub }: { icon: React.ReactNode; value: string | number; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 text-center">
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}

function PerfRow({ label, current, total, pct, color }: { label: string; current: number; total: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-white">{current} / {total}</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ChainNode({ label, count, color, sub }: { label: string; count: number; color: string; sub: string }) {
  return (
    <div className="text-center shrink-0">
      <div className="w-10 h-10 rounded-xl mx-auto mb-1 flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <span className="text-sm font-bold" style={{ color }}>{count}</span>
      </div>
      <p className="text-[11px] text-white font-medium">{label}</p>
      <p className="text-[9px] text-slate-600">{sub}</p>
    </div>
  );
}
