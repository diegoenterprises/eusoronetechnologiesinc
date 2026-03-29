/**
 * MISSION BALANCER PAGE
 * AI-powered load-driver matching and fleet optimization dashboard.
 */
import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Users, Package, Zap, RefreshCw, Truck, MapPin, CheckCircle, BarChart3, Target, ArrowRightLeft, ChevronRight, Search } from "lucide-react";
function cn(...c: (string|false|undefined|null)[]): string { return c.filter(Boolean).join(" "); }
export default function MissionBalancerPage() {
  const { theme } = useTheme(); const L = theme === "light";
  const [search, setSearch] = useState(""); const [tab, setTab] = useState<"overview"|"drivers"|"loads"|"assignments">("overview");
  const dQ = (trpc as any).missionBalancer?.getDashboard?.useQuery?.() ?? { data: null, isLoading: true };
  const d = dQ.data; const cB = L ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/[0.06]";
  const tP = L ? "text-slate-900" : "text-white"; const tS = L ? "text-slate-500" : "text-slate-400";
  const drivers = useMemo(() => { const l = d?.drivers || []; return search ? l.filter((x:any) => x.name?.toLowerCase().includes(search.toLowerCase())) : l; }, [d?.drivers, search]);
  const loads = useMemo(() => { const l = d?.pendingLoads || []; return search ? l.filter((x:any) => x.id?.toLowerCase().includes(search.toLowerCase()) || x.origin?.toLowerCase().includes(search.toLowerCase())) : l; }, [d?.pendingLoads, search]);
  const stats = d ? [
    { label: "Active Drivers", value: d.drivers?.length || 0, icon: Users, color: "text-blue-400", bg: L ? "bg-blue-50" : "bg-blue-500/10" },
    { label: "Pending Loads", value: d.pendingLoads?.length || 0, icon: Package, color: "text-amber-400", bg: L ? "bg-amber-50" : "bg-amber-500/10" },
    { label: "Assignments", value: d.assignments?.length || 0, icon: CheckCircle, color: "text-green-400", bg: L ? "bg-green-50" : "bg-green-500/10" },
    { label: "Fleet Balance", value: `${Math.round((d.fleetBalance || 0) * 100)}%`, icon: Target, color: "text-purple-400", bg: L ? "bg-purple-50" : "bg-purple-500/10" },
  ] : [];
  return (
    <div className={cn("min-h-screen p-6", L ? "bg-slate-50" : "bg-[#0a0a0a]")}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", L ? "bg-purple-100" : "bg-purple-500/15")}><Brain className="w-6 h-6 text-purple-400" /></div>
          <div><h1 className={cn("text-2xl font-bold", tP)}>Mission Balancer</h1><p className={tS}>AI-powered load-driver matching and fleet optimization</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className={cn("pl-9 h-9 w-56 text-sm", L ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")} />
          </div>
          <Button variant="outline" size="sm" onClick={() => dQ.refetch?.()}><RefreshCw className={cn("w-4 h-4 mr-1", dQ.isLoading && "animate-spin")} />Refresh</Button>
        </div>
      </div>
      {dQ.isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i => <div key={i} className={cn("rounded-xl border p-4 animate-pulse h-20", cB)} />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (<div key={s.label} className={cn("rounded-xl border p-4", cB)}>
            <div className="flex items-center gap-2 mb-2"><div className={cn("p-1.5 rounded-lg", s.bg)}><s.icon className={cn("w-4 h-4", s.color)} /></div><span className={cn("text-xs", tS)}>{s.label}</span></div>
            <p className={cn("text-2xl font-bold", tP)}>{s.value}</p></div>))}
        </div>
      )}
      <div className="flex items-center gap-1 mb-6">
        {([["overview","Overview",BarChart3],["drivers","Drivers",Users],["loads","Loads",Package],["assignments","Assignments",ArrowRightLeft]] as const).map(([k,l,I]) => (
          <button key={k} onClick={() => setTab(k as any)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            tab === k ? (L ? "bg-purple-100 text-purple-700" : "bg-purple-500/15 text-purple-400") : (L ? "text-slate-500 hover:bg-slate-100" : "text-slate-400 hover:bg-white/5")
          )}><I className="w-4 h-4" />{l} {k==="drivers" && `(${drivers.length})`}{k==="loads" && `(${loads.length})`}</button>
        ))}
      </div>
      {tab === "overview" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn("rounded-xl border p-5", cB)}>
          <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", tP)}><Users className="w-4 h-4 text-blue-400" />Driver Utilization</h3>
          {drivers.slice(0,8).map((dr:any,i:number) => (<div key={i} className="flex items-center gap-3 mb-3"><span className={cn("text-xs w-28 truncate", tS)}>{dr.name}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-700/30"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width:`${Math.min(100,dr.utilizationPct||0)}%`}} /></div>
            <span className={cn("text-xs w-10 text-right", tS)}>{dr.utilizationPct||0}%</span></div>))}
          {drivers.length === 0 && <p className={cn("text-sm text-center py-4", tS)}>No active drivers</p>}
        </div>
        <div className={cn("rounded-xl border p-5", cB)}>
          <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", tP)}><Package className="w-4 h-4 text-amber-400" />Pending Loads</h3>
          {loads.slice(0,8).map((ld:any,i:number) => (<div key={i} className={cn("flex items-center justify-between py-2 border-b last:border-0", L ? "border-slate-100" : "border-white/5")}>
            <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-green-400" /><span className={cn("text-xs", tP)}>{ld.origin||"—"}</span><ChevronRight className="w-3 h-3 text-slate-500" /><span className={cn("text-xs", tP)}>{ld.destination||"—"}</span></div>
            <Badge className={cn("text-xs", ld.priority==="critical"?"bg-red-500/15 text-red-400":"bg-slate-500/15 text-slate-400")}>{ld.priority||"normal"}</Badge></div>))}
          {loads.length === 0 && <p className={cn("text-sm text-center py-4", tS)}>No pending loads</p>}
        </div>
        <div className={cn("rounded-xl border p-5 lg:col-span-2", cB)}>
          <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", tP)}><Zap className="w-4 h-4 text-amber-400" />AI Suggestions</h3>
          {(d?.assignments||[]).slice(0,5).map((a:any,i:number) => (<div key={i} className={cn("flex items-center justify-between py-3 border-b last:border-0", L ? "border-slate-100" : "border-white/5")}>
            <div className="flex items-center gap-3"><Truck className="w-4 h-4 text-blue-400" /><div><p className={cn("text-sm font-medium", tP)}>{a.driverName||`Driver ${i+1}`}</p><p className={cn("text-xs", tS)}>{a.loadOrigin||"—"} → {a.loadDestination||"—"}</p></div></div>
            <div className="flex items-center gap-3"><span className={cn("text-sm font-bold", a.score>=80?"text-green-400":a.score>=60?"text-amber-400":"text-red-400")}>{a.score||0}%</span>
            <Button size="sm" variant="outline" className="h-7 text-xs">Assign</Button></div></div>))}
          {(!d?.assignments||d.assignments.length===0) && <div className="text-center py-8"><Brain className={cn("w-10 h-10 mx-auto mb-3", tS)} /><p className={cn("text-sm", tS)}>No suggestions yet</p></div>}
        </div>
      </div>}
      {tab === "drivers" && <div className={cn("rounded-xl border", cB)}><div className="p-4 border-b border-white/5"><h3 className={cn("text-sm font-semibold", tP)}>Drivers ({drivers.length})</h3></div>
        {drivers.map((dr:any,i:number) => (<div key={i} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02]">
          <div className="flex items-center gap-3"><div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", L?"bg-blue-100 text-blue-700":"bg-blue-500/15 text-blue-400")}>{(dr.name||"?")[0]}</div>
          <div><p className={cn("text-sm font-medium", tP)}>{dr.name}</p><p className={cn("text-xs", tS)}>{dr.equipmentType||"General"} • {dr.loadsThisWeek||0} loads</p></div></div>
          <div className="flex items-center gap-4"><span className={cn("text-sm font-bold", tP)}>{dr.utilizationPct||0}%</span><span className="text-sm font-bold text-green-400">${(dr.revenueThisWeek||0).toLocaleString()}</span></div></div>))}
        {drivers.length===0 && <div className="p-8 text-center"><p className={cn("text-sm", tS)}>No drivers</p></div>}</div>}
      {tab === "loads" && <div className={cn("rounded-xl border", cB)}><div className="p-4 border-b border-white/5"><h3 className={cn("text-sm font-semibold", tP)}>Loads ({loads.length})</h3></div>
        {loads.map((ld:any,i:number) => (<div key={i} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02]">
          <div className="flex items-center gap-3"><Package className="w-5 h-5 text-amber-400" /><div><p className={cn("text-sm font-medium", tP)}>{ld.id||`Load ${i+1}`}</p><p className={cn("text-xs", tS)}>{ld.origin||"—"} → {ld.destination||"—"}</p></div></div>
          <span className="text-sm font-bold text-green-400">${(ld.rate||0).toLocaleString()}</span></div>))}
        {loads.length===0 && <div className="p-8 text-center"><p className={cn("text-sm", tS)}>No loads</p></div>}</div>}
      {tab === "assignments" && <div className={cn("rounded-xl border", cB)}><div className="p-4 border-b border-white/5"><h3 className={cn("text-sm font-semibold", tP)}>Assignments ({d?.assignments?.length||0})</h3></div>
        {(d?.assignments||[]).map((a:any,i:number) => (<div key={i} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02]">
          <div className="flex items-center gap-3"><ArrowRightLeft className="w-5 h-5 text-purple-400" /><div><p className={cn("text-sm font-medium", tP)}>{a.driverName||"Driver"} → {a.loadId||"Load"}</p><p className={cn("text-xs", tS)}>{a.reason||"Best match"}</p></div></div>
          <div className="flex items-center gap-3"><span className={cn("text-sm font-bold", a.score>=80?"text-green-400":"text-amber-400")}>{a.score||0}%</span>
          <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700"><CheckCircle className="w-3 h-3 mr-1" />Accept</Button></div></div>))}
        {(!d?.assignments||d.assignments.length===0) && <div className="p-8 text-center"><Brain className={cn("w-10 h-10 mx-auto mb-3", tS)} /><p className={cn("text-sm", tS)}>No assignments yet</p></div>}</div>}
    </div>
  );
}
