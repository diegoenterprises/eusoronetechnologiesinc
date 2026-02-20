/**
 * TERMINAL PROFILE PAGE
 * The terminal's identity page for counterparties (shippers, catalysts, brokers).
 * 
 * Tabs: Overview | Compliance | Operations | Partnerships
 * - Overview: Terminal identity, location, contact, edit capability
 * - Compliance: Facility-specific compliance (EPA, OSHA, safety certs)
 * - Operations: Capacity, throughput, docks/racks, 30-day stats
 * - Partnerships: Active counterparties with access levels
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, MapPin, CheckCircle, Shield, ShieldCheck,
  Activity, Droplets, Gauge, Edit, Save, X, Globe, Phone, Mail,
  Handshake, FileCheck, AlertTriangle, Container, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "wouter";

const TERMINAL_TYPE_LABELS: Record<string, string> = {
  refinery: "Refinery", storage: "Storage Facility", rack: "Rack Terminal",
  pipeline: "Pipeline Hub", blending: "Blending Facility", distribution: "Distribution Center",
  marine: "Marine Terminal", rail: "Rail Terminal",
};

const PARTNER_TYPE_COLORS: Record<string, string> = {
  shipper: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  marketer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  broker: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  transporter: "bg-green-500/20 text-green-400 border-green-500/30",
};

const ACCESS_COLORS: Record<string, string> = {
  full: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  limited: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  scheduled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const FACILITY_COMPLIANCE = [
  { name: "EPA Air Quality Permit (Title V)", group: "Environmental", critical: true },
  { name: "SPCC Plan (Spill Prevention)", group: "Environmental", critical: true },
  { name: "Stormwater Pollution Prevention Plan", group: "Environmental", critical: false },
  { name: "OSHA Process Safety Management (PSM)", group: "Safety", critical: true },
  { name: "Risk Management Plan (RMP)", group: "Safety", critical: true },
  { name: "Emergency Response Plan", group: "Safety", critical: true },
  { name: "Fire Prevention Plan", group: "Safety", critical: false },
  { name: "API 653 Tank Inspection", group: "Operations", critical: true },
  { name: "API 570 Piping Inspection", group: "Operations", critical: false },
  { name: "Calibration Certificates (Meters)", group: "Operations", critical: true },
  { name: "DOT 49 CFR Loading/Unloading Compliance", group: "Regulatory", critical: true },
  { name: "State Fire Marshal Permit", group: "Regulatory", critical: false },
  { name: "TCEQ / State Environmental Permit", group: "Regulatory", critical: true },
  { name: "Business Continuity Plan", group: "Administrative", critical: false },
  { name: "Workers' Compensation Insurance", group: "Administrative", critical: true },
  { name: "General Liability Insurance", group: "Administrative", critical: true },
];

export default function FacilityPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get?.("tab") || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null) || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const utils = (trpc as any).useUtils();
  const profileQuery = (trpc as any).terminals.getTerminalProfile.useQuery();
  const complianceQuery = (trpc as any).documentCenter?.getMyComplianceProfile?.useQuery?.() || { data: null, isLoading: false };

  const updateMutation = (trpc as any).terminals.updateTerminalProfile.useMutation({
    onSuccess: () => {
      toast.success("Terminal profile updated");
      utils.terminals.getTerminalProfile.invalidate();
      setIsEditing(false);
      setEditForm(null);
    },
    onError: (e: any) => toast.error("Failed to update", { description: e.message }),
  });

  const data = profileQuery.data;
  const t = data?.terminal;
  const company = data?.company;

  const startEdit = () => {
    setEditForm({
      name: t?.name || "",
      code: t?.code || "",
      address: t?.address || "",
      city: t?.city || "",
      state: t?.state || "",
      terminalType: t?.terminalType || "storage",
      throughputCapacity: t?.throughputCapacity || 0,
      throughputUnit: t?.throughputUnit || "bbl/day",
      dockCount: t?.dockCount || 0,
      tankCount: t?.tankCount || 0,
      latitude: t?.latitude != null ? String(t.latitude) : "",
      longitude: t?.longitude != null ? String(t.longitude) : "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm) return;
    const payload: any = {};
    if (editForm.name) payload.name = editForm.name;
    if (editForm.code !== undefined) payload.code = editForm.code;
    if (editForm.address !== undefined) payload.address = editForm.address;
    if (editForm.city !== undefined) payload.city = editForm.city;
    if (editForm.state !== undefined) payload.state = editForm.state;
    if (editForm.terminalType) payload.terminalType = editForm.terminalType;
    if (editForm.throughputCapacity !== undefined) payload.throughputCapacity = Number(editForm.throughputCapacity) || 0;
    if (editForm.throughputUnit) payload.throughputUnit = editForm.throughputUnit;
    if (editForm.dockCount !== undefined) payload.dockCount = Number(editForm.dockCount) || 0;
    if (editForm.tankCount !== undefined) payload.tankCount = Number(editForm.tankCount) || 0;
    payload.latitude = editForm.latitude ? parseFloat(editForm.latitude) : null;
    payload.longitude = editForm.longitude ? parseFloat(editForm.longitude) : null;
    updateMutation.mutate(payload);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Terminal Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t ? `${t.name}${t.code ? ` (${t.code})` : ""}` : "Your facility identity for counterparties"}
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={startEdit} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Edit className="w-4 h-4 mr-2" />Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm(null); }} className="rounded-lg"><X className="w-4 h-4 mr-1" />Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
              <Save className="w-4 h-4 mr-1" />{updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Identity Banner */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shrink-0">
              <Building2 className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-xs text-slate-400 mb-1 block">Name *</label><Input value={editForm.name} onChange={(e: any) => setEditForm({ ...editForm, name: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Code</label><Input value={editForm.code} onChange={(e: any) => setEditForm({ ...editForm, code: e.target.value })} placeholder="HTN-01" className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Type</label>
                    <select value={editForm.terminalType} onChange={(e: any) => setEditForm({ ...editForm, terminalType: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                      {Object.entries(TERMINAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-slate-400 mb-1 block">Status</label><Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{t?.status || "active"}</Badge></div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">{t?.name || "No Terminal Registered"}</h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {t?.code && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{t.code}</Badge>}
                    {t?.terminalType && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{TERMINAL_TYPE_LABELS[t.terminalType] || t.terminalType}</Badge>}
                    <Badge className={cn("border", t?.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
                      {(t?.status || "active").toUpperCase()}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Activity className="w-6 h-6 text-cyan-400" /></div>
              <div><p className="text-2xl font-bold text-cyan-400">{data?.stats?.appointmentsLast30 || 0}</p><p className="text-xs text-slate-400">Appts (30d)</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20"><CheckCircle className="w-6 h-6 text-emerald-400" /></div>
              <div><p className="text-2xl font-bold text-emerald-400">{data?.stats?.completionRate || 0}%</p><p className="text-xs text-slate-400">Completion Rate</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Users className="w-6 h-6 text-blue-400" /></div>
              <div><p className="text-2xl font-bold text-blue-400">{data?.staffCount || 0}</p><p className="text-xs text-slate-400">Active Staff</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Handshake className="w-6 h-6 text-purple-400" /></div>
              <div><p className="text-2xl font-bold text-purple-400">{data?.partners?.length || 0}</p><p className="text-xs text-slate-400">Partnerships</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-700 rounded-md">Compliance</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700 rounded-md">Operations</TabsTrigger>
          <TabsTrigger value="partnerships" className="data-[state=active]:bg-slate-700 rounded-md">Partnerships</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location & Address */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Location</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div><label className="text-xs text-slate-400 mb-1 block">Address</label><Input value={editForm.address} onChange={(e: any) => setEditForm({ ...editForm, address: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-400 mb-1 block">City</label><Input value={editForm.city} onChange={(e: any) => setEditForm({ ...editForm, city: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                      <div><label className="text-xs text-slate-400 mb-1 block">State</label><Input value={editForm.state} onChange={(e: any) => setEditForm({ ...editForm, state: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-400 mb-1 block">Latitude</label><Input type="number" step="any" value={editForm.latitude} onChange={(e: any) => setEditForm({ ...editForm, latitude: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                      <div><label className="text-xs text-slate-400 mb-1 block">Longitude</label><Input type="number" step="any" value={editForm.longitude} onChange={(e: any) => setEditForm({ ...editForm, longitude: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-700/30">
                      <p className="text-xs text-slate-500 mb-1">Address</p>
                      <p className="text-white text-sm">{t?.address || "Not set"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">City</p><p className="text-white text-sm">{t?.city || "---"}</p></div>
                      <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">State</p><p className="text-white text-sm">{t?.state || "---"}</p></div>
                    </div>
                    {(t?.latitude || t?.longitude) && (
                      <div className="p-3 rounded-lg bg-slate-700/30">
                        <p className="text-xs text-slate-500 mb-1">Coordinates</p>
                        <p className="text-white text-sm font-mono">{t?.latitude?.toFixed(6)}, {t?.longitude?.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact & Company Info */}
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-400" />Company</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Company Name</p>
                  <p className="text-white text-sm font-semibold">{company?.name || "---"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {company?.phone && (
                    <div className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <div><p className="text-xs text-slate-500">Phone</p><p className="text-white text-sm">{company.phone}</p></div>
                    </div>
                  )}
                  {company?.email && (
                    <div className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <div><p className="text-xs text-slate-500">Email</p><p className="text-white text-sm truncate">{company.email}</p></div>
                    </div>
                  )}
                </div>
                {company?.website && (
                  <div className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <div><p className="text-xs text-slate-500">Website</p><p className="text-cyan-400 text-sm">{company.website}</p></div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Products Handled</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(t?.productsHandled || []).length > 0 ? (t?.productsHandled || []).map((p: string) => (
                      <Badge key={p} className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">{p}</Badge>
                    )) : <span className="text-slate-500 text-xs">No products configured</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" />Facility Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-4">Terminal-specific regulatory requirements. Upload documents in the Documents section to mark items as compliant.</p>
              {(() => {
                const groups = FACILITY_COMPLIANCE.reduce((acc: any, item) => {
                  if (!acc[item.group]) acc[item.group] = [];
                  acc[item.group].push(item);
                  return acc;
                }, {} as Record<string, typeof FACILITY_COMPLIANCE>);

                // Check against uploaded company docs
                const uploadedDocs = (complianceQuery.data?.requirements || []).filter((r: any) => r.docStatus === "UPLOADED" || r.docStatus === "VERIFIED").map((r: any) => r.name?.toLowerCase());
                const totalItems = FACILITY_COMPLIANCE.length;
                const matchedItems = FACILITY_COMPLIANCE.filter(fc => uploadedDocs?.some((d: string) => d?.includes(fc.name.toLowerCase().split("(")[0].trim().slice(0, 15)))).length;
                const complianceScore = totalItems > 0 ? Math.round((matchedItems / totalItems) * 100) : 0;

                return (
                  <>
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-slate-700/30">
                      <div className="text-center">
                        <p className={cn("text-3xl font-bold", complianceScore >= 80 ? "text-emerald-400" : complianceScore >= 50 ? "text-amber-400" : "text-red-400")}>{complianceScore}%</p>
                        <p className="text-[10px] text-slate-500">COMPLIANCE</p>
                      </div>
                      <div className="flex-1">
                        <Progress value={complianceScore} className="h-2.5" />
                        <p className="text-xs text-slate-500 mt-1">{matchedItems} of {totalItems} requirements verified</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(groups).map(([group, items]: any) => (
                        <div key={group}>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group}</p>
                          <div className="space-y-1.5">
                            {items.map((item: any) => {
                              const matched = uploadedDocs?.some((d: string) => d?.includes(item.name.toLowerCase().split("(")[0].trim().slice(0, 15)));
                              return (
                                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-colors">
                                  <div className="flex items-center gap-2.5">
                                    {matched ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className={cn("w-4 h-4 shrink-0", item.critical ? "text-red-400" : "text-amber-400")} />}
                                    <span className="text-sm text-white">{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {item.critical && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[9px]">CRITICAL</Badge>}
                                    <Badge className={cn("text-[9px] border", matched ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30")}>
                                      {matched ? "VERIFIED" : "PENDING"}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPERATIONS TAB */}
        <TabsContent value="operations" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400" />Capacity</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-400 mb-1 block">Throughput Capacity</label><Input type="number" value={editForm.throughputCapacity} onChange={(e: any) => setEditForm({ ...editForm, throughputCapacity: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                      <div><label className="text-xs text-slate-400 mb-1 block">Unit</label>
                        <select value={editForm.throughputUnit} onChange={(e: any) => setEditForm({ ...editForm, throughputUnit: e.target.value })} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white">
                          <option value="bbl/day">bbl/day</option><option value="gal/day">gal/day</option><option value="tons/day">tons/day</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-400 mb-1 block">Docks / Racks</label><Input type="number" value={editForm.dockCount} onChange={(e: any) => setEditForm({ ...editForm, dockCount: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                      <div><label className="text-xs text-slate-400 mb-1 block">Tanks</label><Input type="number" value={editForm.tankCount} onChange={(e: any) => setEditForm({ ...editForm, tankCount: e.target.value })} className="bg-slate-800/50 border-slate-700/50 rounded-lg" /></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Droplets className="w-5 h-5 text-cyan-400" />
                        <p className="text-white font-semibold">Throughput</p>
                      </div>
                      <p className="text-2xl font-bold text-cyan-400">{t?.throughputCapacity ? Number(t.throughputCapacity).toLocaleString() : "---"} <span className="text-sm text-slate-400 font-normal">{t?.throughputUnit || "bbl/day"}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                        <Container className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-purple-400">{t?.dockCount || 0}</p>
                        <p className="text-xs text-slate-500">Docks / Racks</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                        <Layers className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-400">{t?.tankCount || 0}</p>
                        <p className="text-xs text-slate-500">Tanks</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" />30-Day Performance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Appointments Completed</span>
                    <span className="text-sm font-bold text-emerald-400">{data?.stats?.completedLast30 || 0} / {data?.stats?.appointmentsLast30 || 0}</span>
                  </div>
                  <Progress value={data?.stats?.completionRate || 0} className="h-2" />
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Active Staff</span>
                    <span className="text-sm font-bold text-blue-400">{data?.staffCount || 0}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Active Partnerships</span>
                    <span className="text-sm font-bold text-purple-400">{(data?.partners || []).filter((p: any) => p.status === "active").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PARTNERSHIPS TAB */}
        <TabsContent value="partnerships" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Handshake className="w-5 h-5 text-purple-400" />Active Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.partners || []).length === 0 ? (
                <div className="text-center py-16">
                  <Handshake className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No partnerships yet</p>
                  <p className="text-slate-500 text-xs mt-1">Partners added via the Supply Chain page will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(data?.partners || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl", p.partnerType === "shipper" ? "bg-blue-500/15" : p.partnerType === "marketer" ? "bg-purple-500/15" : p.partnerType === "broker" ? "bg-amber-500/15" : "bg-green-500/15")}>
                          <Building2 className={cn("w-5 h-5", p.partnerType === "shipper" ? "text-blue-400" : p.partnerType === "marketer" ? "text-purple-400" : p.partnerType === "broker" ? "text-amber-400" : "text-green-400")} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{p.companyName || `Company #${p.companyId}`}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn("text-[9px] border", PARTNER_TYPE_COLORS[p.partnerType] || "bg-slate-500/20 text-slate-400")}>{(p.partnerType || "partner").toUpperCase()}</Badge>
                            <Badge className={cn("text-[9px] border", p.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30")}>{(p.status || "pending").toUpperCase()}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn("text-[9px] border", ACCESS_COLORS[p.rackAccessLevel] || ACCESS_COLORS.scheduled)}>
                          {(p.rackAccessLevel || "scheduled").toUpperCase()} ACCESS
                        </Badge>
                        {p.monthlyVolumeCommitment > 0 && (
                          <p className="text-xs text-slate-500 mt-1">{Number(p.monthlyVolumeCommitment).toLocaleString()} bbl/mo</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
