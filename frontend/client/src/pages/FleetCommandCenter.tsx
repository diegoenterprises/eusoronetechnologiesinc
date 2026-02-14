/**
 * FLEET & WORKFORCE COMMAND CENTER
 * Unified vehicles + drivers hub for carriers.
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Truck, Users, Search, Plus, MapPin, CheckCircle, Wrench,
  AlertTriangle, Phone, Clock, Activity, Package, Navigation,
  Radio, UserPlus, X, Gauge
} from "lucide-react";

type ViewMode = "fleet" | "drivers";

export default function FleetCommandCenter() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [, nav] = useLocation();
  const [view, setView] = useState<ViewMode>("fleet");
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState("all");
  const [showAD, setShowAD] = useState(false);
  const [showAV, setShowAV] = useState(false);
  const [nd, setNd] = useState({ name: "", email: "", phone: "", cdlNumber: "" });
  const [nv, setNv] = useState({ unitNumber: "", vin: "", make: "", model: "", year: "" });

  const fQ = (trpc as any).fleet?.getVehicles?.useQuery?.({ search: "", status: "all" }) || { data: null, isLoading: false, refetch: () => {} };
  const dQ = (trpc as any).drivers?.list?.useQuery?.({ limit: 100 }) || { data: null, isLoading: false, refetch: () => {} };
  const lQ = (trpc as any).telemetry?.getFleetLocations?.useQuery?.({}, { refetchInterval: 15000 }) || { data: null };

  const adM = (trpc as any).drivers?.create?.useMutation?.({ onSuccess: () => { toast.success("Driver added"); setShowAD(false); dQ.refetch?.(); }, onError: (e: any) => toast.error(e?.message || "Failed") }) || { mutate: () => toast.error("Unavailable"), isPending: false };
  const avM = (trpc as any).fleet?.addVehicle?.useMutation?.({ onSuccess: () => { toast.success("Vehicle added"); setShowAV(false); fQ.refetch?.(); }, onError: (e: any) => toast.error(e?.message || "Failed") }) || { mutate: () => toast.error("Unavailable"), isPending: false };

  const vehs = (fQ.data as any)?.vehicles || fQ.data || [];
  const drvs: any[] = Array.isArray(dQ.data) ? dQ.data : [];
  const locs: any[] = lQ.data || [];
  const ld = fQ.isLoading || dQ.isLoading;

  const fv = vehs.filter((v: any) => (!search || v.unitNumber?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase())) && (sf === "all" || v.status === sf));
  const fd = drvs.filter((d: any) => (!search || d.name?.toLowerCase().includes(search.toLowerCase())) && (sf === "all" || d.status === sf));

  const cc = cn("rounded-2xl border transition-all", L ? "bg-white/80 border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60");
  const sb = (s: string) => { const m: Record<string, string> = { active: "bg-green-500/15 text-green-500", driving: "bg-blue-500/15 text-blue-500", maintenance: "bg-yellow-500/15 text-yellow-500", off_duty: "bg-slate-500/15 text-slate-400", inactive: "bg-red-500/15 text-red-500", out_of_service: "bg-red-500/15 text-red-500" }; return <Badge className={cn("border-0 text-[10px] font-bold uppercase", m[s] || "bg-slate-500/15 text-slate-400")}>{s?.replace(/_/g, " ") || "Unknown"}</Badge>; };

  const stats = [
    { l: "Vehicles", v: vehs.length, I: Truck, c: "text-blue-500", b: "from-blue-500/10 to-blue-600/5" },
    { l: "Active", v: vehs.filter((x: any) => x.status === "active").length, I: CheckCircle, c: "text-green-500", b: "from-green-500/10 to-green-600/5" },
    { l: "In Shop", v: vehs.filter((x: any) => x.status === "maintenance").length, I: Wrench, c: "text-yellow-500", b: "from-yellow-500/10 to-yellow-600/5" },
    { l: "Drivers", v: drvs.length, I: Users, c: "text-purple-500", b: "from-purple-500/10 to-purple-600/5" },
    { l: "On Duty", v: drvs.filter((x: any) => x.status === "active" || x.status === "driving").length, I: Radio, c: "text-cyan-500", b: "from-cyan-500/10 to-cyan-600/5" },
    { l: "Driving", v: drvs.filter((x: any) => x.status === "driving").length, I: Navigation, c: "text-emerald-500", b: "from-emerald-500/10 to-emerald-600/5" },
    { l: "Moving", v: locs.filter((x: any) => x.isMoving).length, I: Activity, c: "text-indigo-500", b: "from-indigo-500/10 to-indigo-600/5" },
    { l: "Low HOS", v: drvs.filter((x: any) => x.hosRemaining && x.hosRemaining < 2).length, I: AlertTriangle, c: "text-red-500", b: "from-red-500/10 to-red-600/5" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Fleet Command Center</h1>
          <p className={cn("text-sm", L ? "text-slate-500" : "text-slate-400")}>Unified workforce & vehicle operations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => nav("/fleet-tracking")}><MapPin className="w-4 h-4 mr-1" />Live Map</Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => nav("/zeun-breakdown")}><Wrench className="w-4 h-4 mr-1" />Zeun</Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setShowAV(true)}><Plus className="w-4 h-4 mr-1" />Vehicle</Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setShowAD(true)}><UserPlus className="w-4 h-4 mr-1" />Driver</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((s) => (
          <div key={s.l} className={cn("rounded-2xl p-3 bg-gradient-to-br border", L ? `${s.b} border-slate-200/60` : `${s.b} border-slate-700/30`)}>
            <s.I className={cn("w-4 h-4 mb-1", s.c)} />
            {ld ? <Skeleton className="h-6 w-8" /> : <p className={cn("text-xl font-bold", s.c)}>{s.v}</p>}
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{s.l}</p>
          </div>
        ))}
      </div>

      {/* View Switcher + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className={cn("flex gap-1 p-1 rounded-xl", L ? "bg-slate-100" : "bg-slate-800/60")}>
          {([{ id: "fleet" as ViewMode, l: "Vehicles", I: Truck }, { id: "drivers" as ViewMode, l: "Drivers", I: Users }]).map((t) => (
            <button key={t.id} onClick={() => { setView(t.id); setSearch(""); setSf("all"); }}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                view === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500" : "text-slate-400"
              )}><t.I className="w-3.5 h-3.5" />{t.l}</button>
          ))}
        </div>
        <div className={cn("flex-1 relative max-w-sm rounded-xl border", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={`Search...`} className="pl-9 border-0 bg-transparent rounded-xl focus-visible:ring-0" />
        </div>
      </div>

      {/* VEHICLES */}
      {view === "fleet" && (fQ.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div> : fv.length === 0 ? (
        <Card className={cc}><CardContent className="p-12 text-center"><Truck className="w-12 h-12 mx-auto text-slate-400 mb-3" /><p className="font-medium">No vehicles found</p><Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setShowAV(true)}><Plus className="w-4 h-4 mr-2" />Add Vehicle</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {fv.map((v: any) => (
            <Card key={v.id} className={cn(cc, "cursor-pointer")} onClick={() => nav(`/fleet/${v.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", v.status === "active" ? "bg-green-500/15" : v.status === "maintenance" ? "bg-yellow-500/15" : "bg-red-500/15")}>
                      <Truck className={cn("w-5 h-5", v.status === "active" ? "text-green-500" : v.status === "maintenance" ? "text-yellow-500" : "text-red-500")} />
                    </div>
                    <div><p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{v.unitNumber || `Unit ${v.id}`}</p><p className="text-xs text-slate-400">{v.make} {v.model} {v.year}</p></div>
                  </div>
                  {sb(v.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{v.mileage ? `${(v.mileage/1000).toFixed(0)}k mi` : "N/A"}</span>
                  {v.currentLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.currentLocation.city}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* DRIVERS */}
      {view === "drivers" && (dQ.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div> : fd.length === 0 ? (
        <Card className={cc}><CardContent className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-slate-400 mb-3" /><p className="font-medium">No drivers found</p><Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setShowAD(true)}><UserPlus className="w-4 h-4 mr-2" />Add Driver</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {fd.map((d: any) => (
            <Card key={d.id} className={cn(cc, "cursor-pointer")} onClick={() => nav(`/drivers/${d.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", d.status === "driving" ? "bg-blue-500/15" : d.status === "active" ? "bg-green-500/15" : "bg-slate-500/15")}>
                      <Users className={cn("w-5 h-5", d.status === "driving" ? "text-blue-500" : d.status === "active" ? "text-green-500" : "text-slate-400")} />
                    </div>
                    <div><p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{d.name}</p><p className="text-xs text-slate-400">CDL: {d.cdlNumber || "N/A"} {d.truckNumber && `| ${d.truckNumber}`}</p></div>
                  </div>
                  {sb(d.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {d.hosRemaining !== undefined && <span className={cn("flex items-center gap-1", d.hosRemaining < 2 ? "text-red-500 font-bold" : "")}><Clock className="w-3 h-3" />HOS: {d.hosRemaining}h</span>}
                  <Phone className="w-3.5 h-3.5 hover:text-blue-500 cursor-pointer" onClick={(e: any) => e.stopPropagation()} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* ADD DRIVER MODAL */}
      {showAD && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAD(false)}>
          <div className={cn("w-full max-w-md rounded-2xl p-6 space-y-4", L ? "bg-white" : "bg-slate-900 border border-slate-700")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Add Driver</h2><button onClick={() => setShowAD(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
            <Input placeholder="Full Name" value={nd.name} onChange={(e: any) => setNd({...nd, name: e.target.value})} />
            <Input placeholder="Email" value={nd.email} onChange={(e: any) => setNd({...nd, email: e.target.value})} />
            <Input placeholder="Phone" value={nd.phone} onChange={(e: any) => setNd({...nd, phone: e.target.value})} />
            <Input placeholder="CDL Number" value={nd.cdlNumber} onChange={(e: any) => setNd({...nd, cdlNumber: e.target.value})} />
            <Button className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" disabled={!nd.name || adM.isPending} onClick={() => adM.mutate({ data: nd })}>{adM.isPending ? "Adding..." : "Add Driver"}</Button>
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {showAV && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAV(false)}>
          <div className={cn("w-full max-w-md rounded-2xl p-6 space-y-4", L ? "bg-white" : "bg-slate-900 border border-slate-700")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Add Vehicle</h2><button onClick={() => setShowAV(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
            <Input placeholder="Unit Number" value={nv.unitNumber} onChange={(e: any) => setNv({...nv, unitNumber: e.target.value})} />
            <Input placeholder="VIN" value={nv.vin} onChange={(e: any) => setNv({...nv, vin: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Make" value={nv.make} onChange={(e: any) => setNv({...nv, make: e.target.value})} />
              <Input placeholder="Model" value={nv.model} onChange={(e: any) => setNv({...nv, model: e.target.value})} />
            </div>
            <Input placeholder="Year" value={nv.year} onChange={(e: any) => setNv({...nv, year: e.target.value})} />
            <Button className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" disabled={!nv.unitNumber || avM.isPending} onClick={() => avM.mutate({ data: nv })}>{avM.isPending ? "Adding..." : "Add Vehicle"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
