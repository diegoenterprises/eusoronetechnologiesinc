import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, FileText, CheckCircle, XCircle, AlertTriangle, Plus, Search, Building2, Truck, ArrowRight, Clock, Handshake, Scale, Eye, ChevronRight, Zap, Lock, MapPin, ArrowUpRight, Users, Phone, Globe, Star, Loader2, Leaf, TrendingUp, BarChart3, Calendar, Activity, ShieldAlert, ShieldCheck, Wind, Flame, Heart, Target, Info, ArrowDownRight, Minus } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LEASE_TYPE_LABEL: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  full_lease: { label: "Full Lease-On", color: "text-blue-400", bg: "bg-blue-500/10", desc: "Long-term operation under carrier authority" },
  trip_lease: { label: "Trip Lease", color: "text-amber-400", bg: "bg-amber-500/10", desc: "Single trip authority transfer" },
  interline: { label: "Interline", color: "text-purple-400", bg: "bg-purple-500/10", desc: "Shared haul between two carriers" },
  seasonal: { label: "Seasonal", color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "Seasonal lease arrangement" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-500/10", icon: FileText },
  pending_signatures: { label: "Awaiting Signatures", color: "text-amber-400", bg: "bg-amber-500/10", icon: Clock },
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle },
  expired: { label: "Expired", color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
  terminated: { label: "Terminated", color: "text-red-400", bg: "bg-red-500/10", icon: XCircle },
  suspended: { label: "Suspended", color: "text-orange-400", bg: "bg-orange-500/10", icon: AlertTriangle },
};

const TRAILER_TYPES = [
  "Dry Van", "Flatbed", "Refrigerated", "Tanker (Hazmat)", "Food-Grade Tank", "Water Tank",
  "Lowboy", "Step Deck", "Double Drop", "Conestoga", "Hopper", "Dump",
  "Car Hauler", "Livestock", "Oversized", "Intermodal", "Pneumatic",
  "Side Kit", "Curtain Side", "Cryogenic Tank",
];

const VEHICLE_TYPES = [
  { value: "tractor", label: "Tractor" },
  { value: "trailer", label: "Trailer" },
  { value: "tanker", label: "Tanker" },
  { value: "flatbed", label: "Flatbed" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "dry_van", label: "Dry Van" },
  { value: "lowboy", label: "Lowboy" },
  { value: "step_deck", label: "Step Deck" },
];

export default function OperatingAuthority() {
  const [activeTab, setActiveTab] = useState<"overview" | "leases" | "equipment" | "browse" | "intelligence">("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [fmcsaQuery, setFmcsaQuery] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [showFMCSALeaseDialog, setShowFMCSALeaseDialog] = useState(false);
  const [vForm, setVForm] = useState({ vin: "", make: "", model: "", year: new Date().getFullYear(), vehicleType: "tractor", licensePlate: "", capacity: "" });

  const authorityQuery = (trpc as any).authority?.getMyAuthority?.useQuery?.();
  const leasesQuery = (trpc as any).authority?.getMyLeases?.useQuery?.();
  const statsQuery = (trpc as any).authority?.getLeaseStats?.useQuery?.();
  const equipmentQuery = (trpc as any).authority?.getEquipmentAuthority?.useQuery?.();

  // 2026 Intelligence queries
  const theftRisk = (trpc as any).marketIntelligence?.getTheftRisk?.useQuery?.({ originState: "TX", destinationState: "CA", commodity: "general", weight: 40000 }, { enabled: activeTab === "overview" || activeTab === "intelligence" });
  const marketIntel = (trpc as any).marketIntelligence?.getMarketIntel?.useQuery?.({ originState: "TX", destinationState: "CA", equipmentType: "dry_van", distance: 1500 }, { enabled: activeTab === "intelligence" });
  const emissions = (trpc as any).marketIntelligence?.getEmissions?.useQuery?.({ distanceMiles: 1500, weightLbs: 40000 }, { enabled: activeTab === "overview" || activeTab === "intelligence" || activeTab === "equipment" });
  // Resilience removed — requires real user input, available on Market Intelligence > Resilience tab
  const tariffs = (trpc as any).marketIntelligence?.getTariffImpact?.useQuery?.({ originCountry: "US", destCountry: "US", commodity: "general" }, { enabled: activeTab === "intelligence" });
  const seasonalCal = (trpc as any).marketIntelligence?.getSeasonalCalendar?.useQuery?.(undefined, { enabled: activeTab === "intelligence" });

  const addVehicleMut = (trpc as any).authority?.addVehicle?.useMutation?.({
    onSuccess: (d: any) => { if (d?.success) { toast.success("Vehicle registered"); setShowAddVehicle(false); setVForm({ vin: "", make: "", model: "", year: new Date().getFullYear(), vehicleType: "tractor", licensePlate: "", capacity: "" }); equipmentQuery?.refetch?.(); } },
    onError: (e: any) => toast.error(e?.message || "Failed to register vehicle"),
  }) || { mutate: () => {}, isPending: false };

  const removeVehicleMut = (trpc as any).authority?.removeVehicle?.useMutation?.({
    onSuccess: (d: any) => { if (d?.success) { toast.success("Vehicle removed"); equipmentQuery?.refetch?.(); } },
    onError: (e: any) => toast.error(e?.message || "Failed to remove vehicle"),
  }) || { mutate: () => {}, isPending: false };
  const browseQuery = (trpc as any).authority?.browseAuthorities?.useQuery?.({ search: browseSearch });

  // FMCSA SAFER API search — powers the "Find Authority" tab
  const fmcsaSearchQuery = (trpc as any).authority?.searchAuthority?.useQuery?.(
    { query: fmcsaQuery, searchType: "auto" as const },
    { enabled: fmcsaQuery.length >= 2 }
  );

  const createLeaseMutation = (trpc as any).authority?.createLease?.useMutation?.({
    onSuccess: () => { toast.success("Lease agreement created"); setShowCreateDialog(false); leasesQuery?.refetch?.(); statsQuery?.refetch?.(); authorityQuery?.refetch?.(); },
    onError: (e: any) => toast.error("Failed to create", { description: e.message }),
  });
  const createLeaseFromFMCSAMutation = (trpc as any).authority?.createLeaseFromFMCSA?.useMutation?.({
    onSuccess: () => { toast.success("Lease agreement created from FMCSA data"); setShowFMCSALeaseDialog(false); setSelectedCarrier(null); leasesQuery?.refetch?.(); statsQuery?.refetch?.(); authorityQuery?.refetch?.(); setActiveTab("leases"); },
    onError: (e: any) => toast.error("Failed to create lease", { description: e.message }),
  });
  const updateComplianceMutation = (trpc as any).authority?.updateCompliance?.useMutation?.({
    onSuccess: () => { toast.success("Compliance updated"); leasesQuery?.refetch?.(); authorityQuery?.refetch?.(); },
    onError: (e: any) => toast.error("Update failed", { description: e.message }),
  });
  const signMutation = (trpc as any).authority?.signLease?.useMutation?.({
    onSuccess: () => { toast.success("Lease signed"); leasesQuery?.refetch?.(); authorityQuery?.refetch?.(); },
    onError: (e: any) => toast.error("Signing failed", { description: e.message }),
  });
  const terminateMutation = (trpc as any).authority?.terminateLease?.useMutation?.({
    onSuccess: () => { toast.success("Lease terminated"); leasesQuery?.refetch?.(); statsQuery?.refetch?.(); authorityQuery?.refetch?.(); },
    onError: (e: any) => toast.error("Failed", { description: e.message }),
  });

  const authority = authorityQuery?.data;
  const leases = leasesQuery?.data || [];
  const stats = statsQuery?.data;
  const equipment = equipmentQuery?.data || [];
  const authorities = browseQuery?.data || [];
  const fmcsaResults = fmcsaSearchQuery?.data?.results || [];
  const fmcsaSearching = fmcsaSearchQuery?.isLoading || fmcsaSearchQuery?.isFetching;
  const loading = authorityQuery?.isLoading;

  const complianceScore = authority?.complianceScore ?? 0;

  const tabs = [
    { key: "overview", label: "Overview", icon: Shield },
    { key: "leases", label: "Lease Agreements", icon: Handshake },
    { key: "equipment", label: "Equipment", icon: Truck },
    { key: "browse", label: "Find Authority", icon: Search },
    { key: "intelligence", label: "2026 Intel", icon: Zap },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Operating Authority
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            FMCSR Part 376 · Lease Management · Authority Verification
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg shadow-blue-500/20"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />New Lease
        </Button>
      </div>

      {/* ─── TAB NAV ─── */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === t.key
                ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Leases", value: stats?.active ?? 0, color: "from-emerald-500 to-teal-500", icon: CheckCircle },
              { label: "Pending", value: stats?.pending ?? 0, color: "from-amber-500 to-orange-500", icon: Clock },
              { label: "As Lessor", value: stats?.asLessor ?? 0, color: "from-blue-500 to-cyan-500", icon: Building2 },
              { label: "As Lessee", value: stats?.asLessee ?? 0, color: "from-purple-500 to-pink-500", icon: Truck },
            ].map(s => (
              <Card key={s.label} className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
                <CardContent className="p-4 relative">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{loading ? "—" : s.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center opacity-80`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Own Authority Card */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-blue-400" />Your Authority
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : authority?.ownAuthority ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-semibold text-lg">{authority.ownAuthority.companyName}</p>
                          {authority.ownAuthority.legalName && <p className="text-slate-500 text-xs">{authority.ownAuthority.legalName}</p>}
                        </div>
                        <Badge className={`border-0 text-xs ${authority.ownAuthority.complianceStatus === "compliant" ? "bg-emerald-500/20 text-emerald-400" : authority.ownAuthority.complianceStatus === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                          {authority.ownAuthority.complianceStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <AuthorityField label="MC Number" value={authority.ownAuthority.mcNumber} />
                        <AuthorityField label="USDOT Number" value={authority.ownAuthority.dotNumber} />
                        <AuthorityField label="Insurance" value={authority.ownAuthority.insurancePolicy ? "Active" : "Not on file"} />
                        <AuthorityField label="Insurance Expiry" value={authority.ownAuthority.insuranceExpiry ? new Date(authority.ownAuthority.insuranceExpiry).toLocaleDateString() : "—"} />
                      </div>
                    </div>

                    {/* Active Leases as Lessee */}
                    {authority.activeLeasesAsLessee?.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Operating Under</p>
                        {authority.activeLeasesAsLessee.map((l: any) => (
                          <div key={l.id} className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{l.lessorCompanyName}</p>
                                <p className="text-slate-500 text-xs">MC {l.lessorMcNumber} · DOT {l.lessorDotNumber}</p>
                              </div>
                            </div>
                            <LeaseTypeBadge type={l.leaseType} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active Leases as Lessor */}
                    {authority.activeLeasesAsLessor?.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Operators Under Your Authority</p>
                        {authority.activeLeasesAsLessor.map((l: any) => (
                          <div key={l.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Truck className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{l.lesseeName}</p>
                                <p className="text-slate-500 text-xs">{LEASE_TYPE_LABEL[l.leaseType]?.label || l.leaseType}</p>
                              </div>
                            </div>
                            <LeaseTypeBadge type={l.leaseType} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No authority on file</p>
                    <p className="text-slate-500 text-sm mt-1">Your company's MC/DOT numbers will appear here once registered</p>
                    <Button variant="outline" className="mt-4 rounded-xl border-slate-600" onClick={() => setActiveTab("browse")}>
                      <Search className="w-4 h-4 mr-2" />Browse Authorities to Lease On
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Score */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Scale className="w-5 h-5 text-emerald-400" />FMCSR Part 376
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Ring */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(51,65,85)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={complianceScore >= 80 ? "#10b981" : complianceScore >= 50 ? "#f59e0b" : "#ef4444"} strokeWidth="6" strokeDasharray={`${complianceScore * 2.64} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{complianceScore}%</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Compliance Score</p>
                </div>

                {/* Compliance Checklist */}
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Requirements</p>
                  {[
                    { key: "hasWrittenLease", label: "Written Lease Agreement", icon: FileText },
                    { key: "hasExclusiveControl", label: "Exclusive Vehicle Control", icon: Lock },
                    { key: "hasInsuranceCoverage", label: "Liability Insurance Coverage", icon: Shield },
                    { key: "hasVehicleMarking", label: "DOT Number Vehicle Marking", icon: Truck },
                  ].map(req => {
                    const anyLease = [...(authority?.activeLeasesAsLessee || []), ...(authority?.activeLeasesAsLessor || [])];
                    const met = anyLease.some((l: any) => l[req.key]);
                    return (
                      <div key={req.key} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${met ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-900/40 border border-slate-700/30"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${met ? "bg-emerald-500/20" : "bg-slate-700/50"}`}>
                          {met ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                        <span className={`text-sm ${met ? "text-white" : "text-slate-500"}`}>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── 2026 AUTHORITY INTELLIGENCE PANELS ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cargo Theft Risk for Operating Area */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <p className="text-white font-semibold text-sm">Cargo Theft Risk</p>
                </div>
                {theftRisk?.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Operating Area Risk</span>
                      <Badge className={`border-0 text-[10px] ${theftRisk.data.riskLevel === "CRITICAL" ? "bg-red-500/20 text-red-400" : theftRisk.data.riskLevel === "HIGH" ? "bg-orange-500/20 text-orange-400" : theftRisk.data.riskLevel === "MODERATE" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {theftRisk.data.riskLevel}
                      </Badge>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${theftRisk.data.overallScore > 60 ? "bg-red-500" : theftRisk.data.overallScore > 30 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${theftRisk.data.overallScore}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">Score: {theftRisk.data.overallScore}/100 — {theftRisk.data.recommendations?.[0] || "Monitor theft activity"}</p>
                    <div className="flex flex-wrap gap-1">
                      {theftRisk.data.custodyChain?.filter((c: any) => c.required).slice(0, 3).map((c: any) => (
                        <span key={c.step} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{c.action}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-20 w-full rounded-lg" />
                )}
              </CardContent>
            </Card>

            {/* 2027 EPA Fleet Readiness */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <p className="text-white font-semibold text-sm">2027 EPA Readiness</p>
                </div>
                {emissions?.data ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">SmartWay Rating</span>
                      <Badge className={`border-0 text-[10px] ${emissions.data.smartwayRating === "SUPERIOR" ? "bg-emerald-500/20 text-emerald-400" : emissions.data.smartwayRating === "GOOD" ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {emissions.data.smartwayRating}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-slate-900/40 text-center">
                        <p className="text-white text-sm font-bold">{emissions.data.co2Tons?.toFixed(1)}</p>
                        <p className="text-[9px] text-slate-500">CO2 tons/load</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/40 text-center">
                        <p className="text-white text-sm font-bold">${emissions.data.carbonOffsetCost}</p>
                        <p className="text-[9px] text-slate-500">Offset cost</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">Intermodal could save {emissions.data.vsIntermodalPct}% emissions on long-haul lanes</p>
                  </div>
                ) : (
                  <Skeleton className="h-20 w-full rounded-lg" />
                )}
              </CardContent>
            </Card>

            {/* Authority Health Summary */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <p className="text-white font-semibold text-sm">Authority Health</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "FMCSA Registration", status: authority?.ownAuthority ? "active" : "missing", icon: Shield },
                    { label: "Insurance Coverage", status: authority?.ownAuthority?.insurancePolicy ? "active" : "missing", icon: FileText },
                    { label: "BOC-3 Filing", status: authority?.ownAuthority?.dotNumber ? "active" : "missing", icon: Globe },
                    { label: "UCR Registration", status: "review", icon: Scale },
                    { label: "2027 EPA Compliance", status: "review", icon: Leaf },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-300">{item.label}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${item.status === "active" ? "bg-emerald-400" : item.status === "missing" ? "bg-red-400" : "bg-amber-400"}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2026 Key Alerts Banner */}
          <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">2026 Authority Alerts</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span><span className="text-amber-400 font-medium">EPA 2027:</span> New emission standards take effect — verify fleet compliance. Pre-buy window closing H2 2026.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldAlert className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span><span className="text-red-400 font-medium">Cargo Theft +29%:</span> Identity verification critical — deceptive pickups targeting carriers without strong vetting.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <TrendingUp className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span><span className="text-cyan-400 font-medium">Rate Outlook:</span> Market transitioning from soft to balanced — low single-digit rate increases expected through Q4.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── LEASES TAB ─── */}
      {activeTab === "leases" && (
        <div className="space-y-4">
          {leasesQuery?.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : leases.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="py-16 text-center">
                <Handshake className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold text-lg">No Lease Agreements</p>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                  Create a lease agreement to operate under another carrier's authority, or accept operators under yours.
                </p>
                <Button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />Create Lease Agreement
                </Button>
              </CardContent>
            </Card>
          ) : (
            leases.map((lease: any) => <LeaseCard key={lease.id} lease={lease} onSign={signMutation} onTerminate={terminateMutation} onUpdateCompliance={updateComplianceMutation} />)
          )}
        </div>
      )}

      {/* ─── EQUIPMENT TAB ─── */}
      {activeTab === "equipment" && (
        <div className="space-y-4">
          {/* Fleet EPA Summary Banner */}
          {equipment.length > 0 && (
            <Card className="bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">2027 EPA Fleet Readiness</p>
                      <p className="text-slate-400 text-xs">New heavy-duty emission standards effective 2027 — verify all equipment compliance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">
                      {Math.round(equipment.filter((v: any) => (v.year || 0) >= 2021).length / Math.max(equipment.length, 1) * 100)}%
                    </p>
                    <p className="text-[10px] text-slate-500">Fleet compliant</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="p-2 rounded-lg bg-slate-900/40 text-center">
                    <p className="text-white text-sm font-bold">{equipment.filter((v: any) => (v.year || 0) >= 2024).length}</p>
                    <p className="text-[9px] text-emerald-400">2024+ (EPA Tier 4)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/40 text-center">
                    <p className="text-white text-sm font-bold">{equipment.filter((v: any) => (v.year || 0) >= 2021 && (v.year || 0) < 2024).length}</p>
                    <p className="text-[9px] text-amber-400">2021-2023 (Near compliant)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/40 text-center">
                    <p className="text-white text-sm font-bold">{equipment.filter((v: any) => (v.year || 0) < 2021).length}</p>
                    <p className="text-[9px] text-red-400">Pre-2021 (Action needed)</p>
                  </div>
                </div>
                {emissions?.data && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/30">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Wind className="w-3 h-3 text-emerald-400" />
                      <span>Avg CO2/load: <span className="text-white font-medium">{emissions.data.co2Tons?.toFixed(2)} tons</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Leaf className="w-3 h-3 text-cyan-400" />
                      <span>SmartWay: <span className="text-white font-medium">{emissions.data.smartwayRating}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span>Intermodal saves <span className="text-emerald-400 font-medium">{emissions.data.vsIntermodalPct}%</span> CO2</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">{equipment.length} Vehicle{equipment.length !== 1 ? "s" : ""} Registered</p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl" size="sm" onClick={() => setShowAddVehicle(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Equipment
            </Button>
          </div>
          {equipmentQuery?.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : equipment.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="py-16 text-center">
                <Truck className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <p className="text-white font-semibold text-lg">No Equipment Registered</p>
                <p className="text-slate-500 text-sm mt-1">Register your fleet vehicles to track authority assignments, lease-on status, and 2027 EPA compliance.</p>
                <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl" onClick={() => setShowAddVehicle(true)}>
                  <Plus className="w-4 h-4 mr-2" />Register First Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipment.map((v: any) => {
                const yr = v.year || 0;
                const epaStatus = yr >= 2024 ? "compliant" : yr >= 2021 ? "near" : "action";
                return (
                  <Card key={v.vehicleId} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <div className={`h-0.5 ${epaStatus === "compliant" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : epaStatus === "near" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-orange-500"}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.authoritySource === "leased" ? "bg-blue-500/20" : "bg-slate-700/50"}`}>
                            <Truck className={`w-5 h-5 ${v.authoritySource === "leased" ? "text-blue-400" : "text-slate-400"}`} />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{v.year} {v.make} {v.model}</p>
                            <p className="text-slate-500 text-xs">VIN: {v.vin?.slice(-6)} · {v.licensePlate || "No plate"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right space-y-1">
                            <Badge className={`border-0 text-xs ${v.authoritySource === "leased" ? "bg-blue-500/20 text-blue-400" : "bg-slate-600/30 text-slate-400"}`}>
                              {v.authoritySource === "leased" ? `Leased · MC ${v.leaseMcNumber}` : "Own Authority"}
                            </Badge>
                            <Badge className={`border-0 text-[9px] block ${epaStatus === "compliant" ? "bg-emerald-500/20 text-emerald-400" : epaStatus === "near" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                              {epaStatus === "compliant" ? "EPA 2027 Ready" : epaStatus === "near" ? "Near Compliant" : "Pre-2021 — Upgrade"}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0" onClick={() => { if (confirm("Remove this vehicle from your fleet?")) removeVehicleMut.mutate({ vehicleId: v.vehicleId }); }}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── ADD VEHICLE DIALOG ─── */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2"><Truck className="w-5 h-5 text-blue-400" /> Register Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-400">Make</Label><Input value={vForm.make} onChange={e => setVForm(p => ({ ...p, make: e.target.value }))} placeholder="Freightliner" className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1" /></div>
              <div><Label className="text-xs text-slate-400">Model</Label><Input value={vForm.model} onChange={e => setVForm(p => ({ ...p, model: e.target.value }))} placeholder="Cascadia" className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-400">Year</Label><Input type="number" value={vForm.year} onChange={e => setVForm(p => ({ ...p, year: parseInt(e.target.value) || 2024 }))} className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1" /></div>
              <div><Label className="text-xs text-slate-400">Type</Label>
                <Select value={vForm.vehicleType} onValueChange={v => setVForm(p => ({ ...p, vehicleType: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs text-slate-400">VIN</Label><Input value={vForm.vin} onChange={e => setVForm(p => ({ ...p, vin: e.target.value.toUpperCase() }))} placeholder="1FUJHHDR97LZ12345" maxLength={17} className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-slate-400">License Plate</Label><Input value={vForm.licensePlate} onChange={e => setVForm(p => ({ ...p, licensePlate: e.target.value.toUpperCase() }))} placeholder="ABC-1234" className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1" /></div>
              <div><Label className="text-xs text-slate-400">Capacity (lbs)</Label><Input value={vForm.capacity} onChange={e => setVForm(p => ({ ...p, capacity: e.target.value }))} placeholder="45000" className="bg-slate-800 border-slate-700 text-white rounded-xl mt-1" /></div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mt-2"
              disabled={!vForm.vin || vForm.vin.length < 11 || !vForm.make || !vForm.model || addVehicleMut.isPending}
              onClick={() => addVehicleMut.mutate({ vin: vForm.vin, make: vForm.make, model: vForm.model, year: vForm.year, vehicleType: vForm.vehicleType as any, licensePlate: vForm.licensePlate || undefined, capacity: vForm.capacity || undefined })}
            >
              {addVehicleMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Register Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── FIND AUTHORITY TAB (FMCSA SAFER) ─── */}
      {activeTab === "browse" && (
        <div className="space-y-5">
          {/* FMCSA Search Bar */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">FMCSA SAFER Lookup</p>
                  <p className="text-slate-500 text-xs">Search the federal motor carrier database by DOT#, MC#, or company name</p>
                </div>
              </div>
              <form onSubmit={e => { e.preventDefault(); setFmcsaQuery(browseSearch.trim()); }} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Enter DOT#, MC#, or company name..."
                    value={browseSearch}
                    onChange={e => setBrowseSearch(e.target.value)}
                    className="pl-10 bg-slate-900/60 border-slate-700/50 text-white rounded-xl h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={browseSearch.trim().length < 2 || fmcsaSearching}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-11 px-6"
                >
                  {fmcsaSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-2">{fmcsaSearching ? "Searching..." : "Search"}</span>
                </Button>
              </form>
              {fmcsaSearchQuery?.data?.searchType && (
                <p className="text-xs text-slate-600 mt-2">
                  Searched by: <span className="text-slate-400 uppercase">{fmcsaSearchQuery.data.searchType}</span>
                  {fmcsaSearchQuery.data.error && <span className="text-red-400 ml-2">({fmcsaSearchQuery.data.error})</span>}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {fmcsaSearching ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : fmcsaQuery && fmcsaResults.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="py-14 text-center">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-semibold">No Results Found</p>
                <p className="text-slate-500 text-sm mt-1">No carriers found matching "{fmcsaQuery}" in the FMCSA database.</p>
              </CardContent>
            </Card>
          ) : fmcsaResults.length > 0 ? (
            <div className="space-y-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                {fmcsaResults.length} carrier{fmcsaResults.length > 1 ? "s" : ""} found
              </p>
              {fmcsaResults.map((c: any, idx: number) => (
                <Card key={`${c.dotNumber}-${idx}`} className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/30 transition-all overflow-hidden">
                  <div className={`h-0.5 ${c.allowedToOperate ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-orange-500"}`} />
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.allowedToOperate ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                          <Building2 className={`w-5 h-5 ${c.allowedToOperate ? "text-emerald-400" : "text-red-400"}`} />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-base">{c.legalName}</p>
                          {c.dbaName && c.dbaName !== c.legalName && (
                            <p className="text-slate-500 text-xs mt-0.5">DBA: {c.dbaName}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={`border-0 text-[10px] ${c.allowedToOperate ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                              {c.operatingStatus}
                            </Badge>
                            <Badge className="border-0 text-[10px] bg-blue-500/15 text-blue-400">FMCSA Verified</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-xs px-4"
                        onClick={() => { setSelectedCarrier(c); setShowFMCSALeaseDialog(true); }}
                      >
                        <Handshake className="w-3.5 h-3.5 mr-1.5" />Start Lease
                      </Button>
                    </div>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <AuthorityField label="US DOT Number" value={c.dotNumber} />
                      <AuthorityField label="MC Number" value={c.mcNumber || "N/A"} />
                      <AuthorityField label="Safety Rating" value={c.safetyRating} />
                      <AuthorityField label="Fleet Size" value={`${c.fleetSize} units`} />
                    </div>

                    {/* Authority Types & Details */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {c.commonAuthority && c.commonAuthority !== "N" && (
                        <Badge className="border-0 text-[10px] bg-purple-500/15 text-purple-400">Common Authority: {c.commonAuthority}</Badge>
                      )}
                      {c.contractAuthority && c.contractAuthority !== "N" && (
                        <Badge className="border-0 text-[10px] bg-amber-500/15 text-amber-400">Contract Authority: {c.contractAuthority}</Badge>
                      )}
                      {c.brokerAuthority && c.brokerAuthority !== "N" && (
                        <Badge className="border-0 text-[10px] bg-cyan-500/15 text-cyan-400">Broker Authority: {c.brokerAuthority}</Badge>
                      )}
                      {c.hazmat && (
                        <Badge className="border-0 text-[10px] bg-orange-500/15 text-orange-400">HAZMAT</Badge>
                      )}
                      {c.bipdInsurance && (
                        <Badge className="border-0 text-[10px] bg-emerald-500/15 text-emerald-400">BIPD Insured</Badge>
                      )}
                      {c.cargoInsurance && (
                        <Badge className="border-0 text-[10px] bg-emerald-500/15 text-emerald-400">Cargo Insured</Badge>
                      )}
                    </div>

                    {/* 2026 Carrier Vetting Intelligence */}
                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/20 mb-3">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-medium mb-2">2026 Carrier Intelligence</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className={`w-3.5 h-3.5 ${c.safetyRating === "Satisfactory" ? "text-emerald-400" : c.safetyRating === "Conditional" ? "text-amber-400" : c.safetyRating === "Unsatisfactory" ? "text-red-400" : "text-slate-500"}`} />
                          <div>
                            <p className="text-[9px] text-slate-500">Safety</p>
                            <p className={`text-[10px] font-medium ${c.safetyRating === "Satisfactory" ? "text-emerald-400" : c.safetyRating === "Conditional" ? "text-amber-400" : c.safetyRating === "Unsatisfactory" ? "text-red-400" : "text-slate-400"}`}>{c.safetyRating || "Not Rated"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Lock className={`w-3.5 h-3.5 ${c.bipdInsurance && c.cargoInsurance ? "text-emerald-400" : c.bipdInsurance || c.cargoInsurance ? "text-amber-400" : "text-red-400"}`} />
                          <div>
                            <p className="text-[9px] text-slate-500">Insurance</p>
                            <p className={`text-[10px] font-medium ${c.bipdInsurance && c.cargoInsurance ? "text-emerald-400" : "text-amber-400"}`}>{c.bipdInsurance && c.cargoInsurance ? "Full Coverage" : c.bipdInsurance ? "BIPD Only" : "Incomplete"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className={`w-3.5 h-3.5 ${c.fleetSize > 50 ? "text-emerald-400" : c.fleetSize > 10 ? "text-cyan-400" : "text-amber-400"}`} />
                          <div>
                            <p className="text-[9px] text-slate-500">Scale</p>
                            <p className="text-[10px] font-medium text-slate-300">{c.fleetSize > 50 ? "Large Fleet" : c.fleetSize > 10 ? "Mid Fleet" : "Small Op"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className={`w-3.5 h-3.5 ${c.allowedToOperate ? "text-emerald-400" : "text-red-400"}`} />
                          <div>
                            <p className="text-[9px] text-slate-500">Theft Risk</p>
                            <p className="text-[10px] font-medium text-amber-400">Verify ID</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {c.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{c.address}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{c.phone}
                        </span>
                      )}
                      {c.driverCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{c.driverCount} drivers
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !fmcsaQuery ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="py-14 text-center">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-semibold">Search the FMCSA Database</p>
                <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                  Look up any motor carrier in the US DOT system. Enter a DOT number, MC number, or company name to get started.
                </p>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-600">
                  <span>Try: <span className="text-slate-400">2233435</span></span>
                  <span>Try: <span className="text-slate-400">MC-123456</span></span>
                  <span>Try: <span className="text-slate-400">Swift Transportation</span></span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* ─── 2026 INTELLIGENCE TAB ─── */}
      {activeTab === "intelligence" && (
        <div className="space-y-5">
          {/* Market Rate Intelligence */}
          {marketIntel?.data && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <p className="text-white font-semibold">Market Rate Intelligence</p>
                  </div>
                  <Badge className={`border-0 text-xs ${marketIntel.data.currentPhase === "TIGHTENING" ? "bg-red-500/20 text-red-400" : marketIntel.data.currentPhase === "BALANCED" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {marketIntel.data.currentPhase}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Spot Rate</p>
                    <p className="text-xl font-bold text-cyan-400">${marketIntel.data.laneIntel?.avgSpotRate}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      {marketIntel.data.spotRateTrend === "RISING" ? <ArrowUpRight className="w-3 h-3 text-red-400" /> : marketIntel.data.spotRateTrend === "DECLINING" ? <ArrowDownRight className="w-3 h-3 text-emerald-400" /> : <Minus className="w-3 h-3 text-slate-400" />}
                      <span className="text-[10px] text-slate-500">{marketIntel.data.spotRateTrend}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Contract Rate</p>
                    <p className="text-xl font-bold text-blue-400">${marketIntel.data.laneIntel?.avgContractRate}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      {marketIntel.data.contractRateTrend === "RISING" ? <ArrowUpRight className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-slate-400" />}
                      <span className="text-[10px] text-slate-500">{marketIntel.data.contractRateTrend}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">Demand</p>
                    <p className="text-xl font-bold text-amber-400">{marketIntel.data.laneIntel?.demandIndex}</p>
                    <p className="text-[10px] text-slate-500">/ 100</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">YoY Change</p>
                    <p className="text-xl font-bold text-white">+{marketIntel.data.yearOverYearChange}%</p>
                    <p className="text-[10px] text-slate-500">spot rates</p>
                  </div>
                </div>
                {/* Quarterly Forecast */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {marketIntel.data.quarterlyForecast?.map((q: any) => (
                    <div key={q.quarter} className="p-2 rounded-lg bg-slate-900/30 text-center">
                      <p className="text-[9px] text-slate-500 font-medium">{q.quarter}</p>
                      <p className="text-xs font-bold text-white mt-0.5">+{q.spotChange}%</p>
                      <Badge className={`border-0 text-[8px] mt-0.5 ${q.capacity === "SURPLUS" ? "bg-emerald-500/20 text-emerald-400" : q.capacity === "TIGHTENING" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{q.capacity}</Badge>
                    </div>
                  ))}
                </div>
                {/* Key Insights */}
                <div className="space-y-1">
                  {marketIntel.data.keyInsights?.slice(0, 3).map((k: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                      <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cargo Theft Deep Dive */}
            {theftRisk?.data && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <p className="text-white font-semibold">Cargo Theft Risk</p>
                    </div>
                    <Badge className={`border-0 text-xs ${theftRisk.data.riskLevel === "CRITICAL" ? "bg-red-500/20 text-red-400" : theftRisk.data.riskLevel === "HIGH" ? "bg-orange-500/20 text-orange-400" : theftRisk.data.riskLevel === "MODERATE" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {theftRisk.data.riskLevel} — {theftRisk.data.overallScore}/100
                    </Badge>
                  </div>
                  {theftRisk.data.factors?.map((f: any, i: number) => (
                    <div key={i} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">{f.factor}</span>
                        <span className="text-[10px] text-white font-medium">{Math.round(f.score)}</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${f.score > 60 ? "bg-red-400" : f.score > 30 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${f.score}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-medium">Custody Chain</p>
                    {theftRisk.data.custodyChain?.filter((c: any) => c.required).map((c: any) => (
                      <div key={c.step} className="flex items-center gap-2 text-[11px] text-slate-300">
                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{c.action}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resilience removed — requires real user input via Market Intelligence > Resilience tab */}
          </div>

          {/* Tariff & Trade Policy */}
          {tariffs?.data && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <p className="text-white font-semibold">Tariff & Trade Policy Impact</p>
                  </div>
                  <Badge className={`border-0 text-xs ${tariffs.data.affectedByTariffs ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {tariffs.data.affectedByTariffs ? "Exposure Detected" : "No Direct Exposure"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tariffs.data.tariffAlerts?.map((a: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white font-semibold">{a.policy}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{a.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{a.impact}</p>
                      <p className="text-[10px] text-cyan-400 mt-1">{a.action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Disruption Calendar */}
          {seasonalCal?.data && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <p className="text-white font-semibold">2026 Seasonal Disruption Calendar</p>
                </div>
                <div className="space-y-2">
                  {seasonalCal.data.events?.slice(0, 8).map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
                      <Badge className={`border-0 text-[9px] min-w-[48px] text-center ${e.impact === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{e.impact}</Badge>
                      <span className="text-[10px] text-slate-500 w-16 font-medium">{e.month}</span>
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">{e.event}</p>
                        <p className="text-[10px] text-slate-400">{e.description}</p>
                      </div>
                      <span className="text-[10px] text-cyan-400 max-w-[140px] text-right">{e.action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emissions Summary for Authority */}
          {emissions?.data && (
            <Card className="bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <p className="text-white font-semibold">Emissions & 2027 EPA Readiness</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500">CO2/Load</p>
                    <p className="text-lg font-bold text-emerald-400">{emissions.data.co2Tons?.toFixed(2)}</p>
                    <p className="text-[9px] text-slate-500">metric tons</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500">Fuel/Load</p>
                    <p className="text-lg font-bold text-blue-400">{emissions.data.fuelGallons?.toFixed(0)}</p>
                    <p className="text-[9px] text-slate-500">gallons</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500">Fuel Cost</p>
                    <p className="text-lg font-bold text-amber-400">${emissions.data.fuelCost}</p>
                    <p className="text-[9px] text-slate-500">per load</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500">SmartWay</p>
                    <p className={`text-lg font-bold ${emissions.data.smartwayRating === "SUPERIOR" ? "text-emerald-400" : emissions.data.smartwayRating === "GOOD" ? "text-cyan-400" : "text-amber-400"}`}>{emissions.data.smartwayRating}</p>
                    <p className="text-[9px] text-slate-500">rating</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-500">Carbon Offset</p>
                    <p className="text-lg font-bold text-white">${emissions.data.carbonOffsetCost}</p>
                    <p className="text-[9px] text-slate-500">per load</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {emissions.data.recommendations?.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                      <Leaf className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── CREATE LEASE DIALOG ─── */}
      <CreateLeaseDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSubmit={createLeaseMutation} authorities={authorities} />

      {/* ─── FMCSA LEASE DIALOG ─── */}
      <FMCSALeaseDialog
        open={showFMCSALeaseDialog}
        onOpenChange={setShowFMCSALeaseDialog}
        carrier={selectedCarrier}
        onSubmit={createLeaseFromFMCSAMutation}
      />
    </div>
  );
}

function AuthorityField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-white text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

function LeaseTypeBadge({ type }: { type: string }) {
  const cfg = LEASE_TYPE_LABEL[type] || { label: type, color: "text-slate-400", bg: "bg-slate-500/10" };
  return <Badge className={`border-0 text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>;
}

function LeaseCard({ lease, onSign, onTerminate, onUpdateCompliance }: { lease: any; onSign: any; onTerminate: any; onUpdateCompliance: any }) {
  const stCfg = STATUS_CFG[lease.status] || STATUS_CFG.draft;
  const StIcon = stCfg.icon;
  const complianceChecks = [
    { key: "hasWrittenLease", label: "Written Lease" },
    { key: "hasExclusiveControl", label: "Exclusive Control" },
    { key: "hasInsuranceCoverage", label: "Insurance" },
    { key: "hasVehicleMarking", label: "DOT Marking" },
  ];
  const passed = complianceChecks.filter(c => lease[c.key]).length;
  const total = complianceChecks.length;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
      <div className={`h-0.5 ${lease.status === "active" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : lease.status === "pending_signatures" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-slate-700"}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stCfg.bg} flex items-center justify-center`}>
              <StIcon className={`w-5 h-5 ${stCfg.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold">
                  {lease.isLessor ? lease.lesseeName : lease.lessorCompanyName}
                </p>
                <Badge className={`border-0 text-xs ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <LeaseTypeBadge type={lease.leaseType} />
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-slate-500 text-xs">
                  {lease.isLessor ? "Operator under your authority" : "You operate under their authority"}
                </span>
              </div>
            </div>
          </div>
          {lease.revenueSharePercent && (
            <div className="text-right">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Revenue Split</p>
              <p className="text-white font-bold text-lg">{lease.revenueSharePercent}%</p>
            </div>
          )}
        </div>

        {/* Authority details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {lease.mcNumber && <AuthorityField label="MC Number" value={lease.mcNumber} />}
          {lease.dotNumber && <AuthorityField label="DOT Number" value={lease.dotNumber} />}
          {lease.startDate && <AuthorityField label="Start Date" value={new Date(lease.startDate).toLocaleDateString()} />}
          {lease.endDate && <AuthorityField label="End Date" value={new Date(lease.endDate).toLocaleDateString()} />}
        </div>

        {/* Trip lease route */}
        {lease.leaseType === "trip_lease" && (lease.originCity || lease.destinationCity) && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 mb-4">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm text-white">
              {lease.originCity}{lease.originState ? `, ${lease.originState}` : ""}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-white">
              {lease.destinationCity}{lease.destinationState ? `, ${lease.destinationState}` : ""}
            </span>
          </div>
        )}

        {/* Compliance progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 text-xs font-medium">FMCSR Part 376 Compliance</span>
            <span className={`text-xs font-bold ${passed === total ? "text-emerald-400" : "text-amber-400"}`}>{passed}/{total}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${passed === total ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${(passed / total) * 100}%` }} />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {complianceChecks.map(c => (
              <button
                key={c.key}
                onClick={() => onUpdateCompliance?.mutate?.({ leaseId: lease.id, [c.key]: !lease[c.key] })}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  lease[c.key]
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-800 text-slate-500 border border-slate-700/50 hover:border-slate-600"
                }`}
              >
                {lease[c.key] ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Signatures */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`flex items-center gap-1.5 text-xs ${lease.lessorSignedAt ? "text-emerald-400" : "text-slate-500"}`}>
            {lease.lessorSignedAt ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            Lessor {lease.lessorSignedAt ? `signed ${new Date(lease.lessorSignedAt).toLocaleDateString()}` : "unsigned"}
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${lease.lesseeSignedAt ? "text-emerald-400" : "text-slate-500"}`}>
            {lease.lesseeSignedAt ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            Lessee {lease.lesseeSignedAt ? `signed ${new Date(lease.lesseeSignedAt).toLocaleDateString()}` : "unsigned"}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {lease.status !== "terminated" && lease.status !== "expired" && (
            <>
              {lease.isLessor && !lease.lessorSignedAt && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg text-xs" onClick={() => onSign?.mutate?.({ leaseId: lease.id, role: "lessor" })}>
                  Sign as Lessor
                </Button>
              )}
              {lease.isLessee && !lease.lesseeSignedAt && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg text-xs" onClick={() => onSign?.mutate?.({ leaseId: lease.id, role: "lessee" })}>
                  Sign as Lessee
                </Button>
              )}
              <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-xs" onClick={() => onTerminate?.mutate?.({ leaseId: lease.id })}>
                Terminate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateLeaseDialog({ open, onOpenChange, onSubmit, authorities }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: any; authorities: any[] }) {
  const [form, setForm] = useState({
    lessorCompanyId: 0,
    leaseType: "full_lease" as string,
    startDate: "",
    endDate: "",
    revenueSharePercent: 75,
    originCity: "",
    originState: "",
    destinationCity: "",
    destinationState: "",
    trailerTypes: [] as string[],
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.lessorCompanyId) { toast.error("Select a carrier"); return; }
    onSubmit?.mutate?.({
      lessorCompanyId: form.lessorCompanyId,
      leaseType: form.leaseType,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      revenueSharePercent: form.revenueSharePercent || undefined,
      originCity: form.originCity || undefined,
      originState: form.originState || undefined,
      destinationCity: form.destinationCity || undefined,
      destinationState: form.destinationState || undefined,
      trailerTypes: form.trailerTypes.length > 0 ? form.trailerTypes : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            New Lease Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Lease Type */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Lease Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {Object.entries(LEASE_TYPE_LABEL).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, leaseType: key }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.leaseType === key
                      ? `${cfg.bg} border-current ${cfg.color}`
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <p className="font-medium text-sm">{cfg.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{cfg.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Carrier Selection */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Carrier (Lessor)</Label>
            <Select value={form.lessorCompanyId ? String(form.lessorCompanyId) : ""} onValueChange={v => setForm(f => ({ ...f, lessorCompanyId: Number(v) }))}>
              <SelectTrigger className="mt-1.5 bg-slate-800/50 border-slate-700/50 rounded-xl"><SelectValue placeholder="Select carrier..." /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {authorities.map((a: any) => (
                  <SelectItem key={a.companyId} value={String(a.companyId)} className="text-white">
                    {a.companyName} {a.mcNumber ? `(MC ${a.mcNumber})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Share */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Revenue Share (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.revenueSharePercent}
              onChange={e => setForm(f => ({ ...f, revenueSharePercent: Number(e.target.value) }))}
              className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Start Date</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">End Date</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
            </div>
          </div>

          {/* Trip Lease Route */}
          {form.leaseType === "trip_lease" && (
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Route</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <Input placeholder="Origin city" value={form.originCity} onChange={e => setForm(f => ({ ...f, originCity: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Origin state" value={form.originState} onChange={e => setForm(f => ({ ...f, originState: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Destination city" value={form.destinationCity} onChange={e => setForm(f => ({ ...f, destinationCity: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Destination state" value={form.destinationState} onChange={e => setForm(f => ({ ...f, destinationState: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
              </div>
            </div>
          )}

          {/* Trailer Types */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Trailer Types</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {TRAILER_TYPES.map(tt => (
                <button
                  key={tt}
                  onClick={() => setForm(f => ({
                    ...f,
                    trailerTypes: f.trailerTypes.includes(tt) ? f.trailerTypes.filter(t => t !== tt) : [...f.trailerTypes, tt],
                  }))}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    form.trailerTypes.includes(tt)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700/50 hover:border-slate-600"
                  }`}
                >
                  {tt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional terms or notes..."
              className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={onSubmit?.isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-11 text-sm font-semibold"
          >
            {onSubmit?.isLoading ? "Creating..." : "Create Lease Agreement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FMCSALeaseDialog({ open, onOpenChange, carrier, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; carrier: any; onSubmit: any }) {
  const [form, setForm] = useState({
    leaseType: "full_lease" as string,
    startDate: "",
    endDate: "",
    revenueSharePercent: 75,
    originCity: "",
    originState: "",
    destinationCity: "",
    destinationState: "",
    trailerTypes: [] as string[],
    notes: "",
  });

  if (!carrier) return null;

  const handleSubmit = () => {
    onSubmit?.mutate?.({
      dotNumber: carrier.dotNumber,
      mcNumber: carrier.mcNumber || undefined,
      legalName: carrier.legalName,
      address: carrier.address || undefined,
      city: carrier.city || undefined,
      state: carrier.state || undefined,
      phone: carrier.phone || undefined,
      leaseType: form.leaseType,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      revenueSharePercent: form.revenueSharePercent || undefined,
      originCity: form.originCity || undefined,
      originState: form.originState || undefined,
      destinationCity: form.destinationCity || undefined,
      destinationState: form.destinationState || undefined,
      trailerTypes: form.trailerTypes.length > 0 ? form.trailerTypes : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Start Lease Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Carrier Info (pre-filled from FMCSA) */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${carrier.allowedToOperate ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <Building2 className={`w-5 h-5 ${carrier.allowedToOperate ? "text-emerald-400" : "text-red-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{carrier.legalName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>DOT {carrier.dotNumber}</span>
                    {carrier.mcNumber && <span>{carrier.mcNumber}</span>}
                    <Badge className={`border-0 text-[9px] ${carrier.allowedToOperate ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {carrier.operatingStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Type */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Lease Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {Object.entries(LEASE_TYPE_LABEL).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, leaseType: key }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.leaseType === key
                      ? `${cfg.bg} border-current ${cfg.color}`
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <p className="font-medium text-sm">{cfg.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{cfg.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Share */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Revenue Share (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.revenueSharePercent}
              onChange={e => setForm(f => ({ ...f, revenueSharePercent: Number(e.target.value) }))}
              className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Start Date</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">End Date</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
            </div>
          </div>

          {/* Trip Lease Route */}
          {form.leaseType === "trip_lease" && (
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Route</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <Input placeholder="Origin city" value={form.originCity} onChange={e => setForm(f => ({ ...f, originCity: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Origin state" value={form.originState} onChange={e => setForm(f => ({ ...f, originState: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Destination city" value={form.destinationCity} onChange={e => setForm(f => ({ ...f, destinationCity: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
                <Input placeholder="Destination state" value={form.destinationState} onChange={e => setForm(f => ({ ...f, destinationState: e.target.value }))} className="bg-slate-800/50 border-slate-700/50 text-white rounded-xl" />
              </div>
            </div>
          )}

          {/* Trailer Types */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Trailer Types</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {TRAILER_TYPES.map(tt => (
                <button
                  key={tt}
                  onClick={() => setForm(f => ({
                    ...f,
                    trailerTypes: f.trailerTypes.includes(tt) ? f.trailerTypes.filter(t => t !== tt) : [...f.trailerTypes, tt],
                  }))}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    form.trailerTypes.includes(tt)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700/50 hover:border-slate-600"
                  }`}
                >
                  {tt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional terms or notes..."
              className="mt-1.5 bg-slate-800/50 border-slate-700/50 text-white rounded-xl resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={onSubmit?.isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl h-11 text-sm font-semibold"
          >
            {onSubmit?.isLoading ? "Creating Lease..." : `Create Lease with ${carrier.legalName}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
