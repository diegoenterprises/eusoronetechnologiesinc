/**
 * EQUIPMENT INTELLIGENCE PAGE
 * ESANG AI ZEUN Mechanics — Equipment profiles, product readiness,
 * match scoring, and AI equipment advisor for oil & gas trucking.
 *
 * Tabs: My Equipment | Product Readiness | Equipment Catalog | AI Advisor
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Wrench, Shield, ShieldCheck, ShieldAlert, Check, X, AlertTriangle,
  Sparkles, Send, Loader2, ChevronDown, ChevronRight, Package,
  Cable, Gauge, Wind, Factory, ArrowUpDown, Ruler, Award, Container,
  CheckCircle, XCircle, Info, Search, RefreshCw, Zap,
  Lock, Thermometer, Maximize, Box, Truck, ScanLine, Activity,
  Calendar, Hash, MapPin, Fuel, Eye, CircleDot,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Cable: <Cable className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Gauge: <Gauge className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  ArrowUpDown: <ArrowUpDown className="w-4 h-4" />,
  Ruler: <Ruler className="w-4 h-4" />,
  Factory: <Factory className="w-4 h-4" />,
  Container: <Container className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  Lock: <Lock className="w-4 h-4" />,
  Thermometer: <Thermometer className="w-4 h-4" />,
  Maximize: <Maximize className="w-4 h-4" />,
  Box: <Box className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
};

type TabId = "overview" | "profile" | "readiness" | "catalog" | "advisor";

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  tractor: "Tractor",
  trailer: "Trailer",
  tanker: "Tanker",
  flatbed: "Flatbed",
  refrigerated: "Reefer",
  dry_van: "Dry Van",
  lowboy: "Lowboy",
  step_deck: "Step Deck",
};

const VEHICLE_TYPE_COLORS: Record<string, { icon: string; bg: string }> = {
  tractor: { icon: "text-blue-500", bg: "bg-blue-500/15" },
  tanker: { icon: "text-purple-500", bg: "bg-purple-500/15" },
  flatbed: { icon: "text-orange-500", bg: "bg-orange-500/15" },
  refrigerated: { icon: "text-cyan-500", bg: "bg-cyan-500/15" },
  dry_van: { icon: "text-emerald-500", bg: "bg-emerald-500/15" },
  lowboy: { icon: "text-red-500", bg: "bg-red-500/15" },
  step_deck: { icon: "text-yellow-500", bg: "bg-yellow-500/15" },
  trailer: { icon: "text-slate-500", bg: "bg-slate-500/15" },
};

export function EquipmentIntelligencePanel() {
  const { theme } = useTheme();
  const L = theme === "light";
  const cc = cn("rounded-2xl border overflow-hidden", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const vl = L ? "text-slate-800" : "text-white";
  const mt = L ? "text-slate-500" : "text-slate-400";

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>("profile");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [advisorQ, setAdvisorQ] = useState("");
  const [advisorProduct, setAdvisorProduct] = useState("crude_oil");
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Data ────────────────────────────────────────────────────────────────
  const vehiclesQ = (trpc as any).equipmentIntelligence?.getMyVehicles?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const myVehicles: any[] = vehiclesQ.data || [];

  const vehicleProfileQ = (trpc as any).equipmentIntelligence?.getVehicleProfile?.useQuery?.(
    { vehicleId: selectedVehicleId! },
    { enabled: !!selectedVehicleId }
  ) || { data: null, isLoading: false, refetch: () => {} };

  const vehicleStatsQ = (trpc as any).equipmentIntelligence?.getVehicleStats?.useQuery?.(
    { vehicleId: selectedVehicleId! },
    { enabled: !!selectedVehicleId }
  ) || { data: null, isLoading: false, refetch: () => {} };

  const catalogQ = (trpc as any).equipmentIntelligence?.getCatalog?.useQuery?.() || { data: null, isLoading: false };
  const productsQ = (trpc as any).equipmentIntelligence?.getProductProfiles?.useQuery?.() || { data: null, isLoading: false };

  const saveMut = (trpc as any).equipmentIntelligence?.saveVehicleProfile?.useMutation?.() || { mutateAsync: async () => {}, isPending: false };
  const advisorMut = (trpc as any).equipmentIntelligence?.askAdvisor?.useMutation?.() || { mutateAsync: async () => ({}), isPending: false, data: null };
  const scanMut = (trpc as any).equipmentIntelligence?.scanVehicleIntelligence?.useMutation?.() || { mutateAsync: async () => ({}), isPending: false, data: null };
  const updateDetailsMut = (trpc as any).equipmentIntelligence?.updateVehicleDetails?.useMutation?.() || { mutateAsync: async () => {}, isPending: false };

  const vehicleProfile = vehicleProfileQ.data || { items: [], certifications: [], relevantCategories: [] };
  const stats = vehicleStatsQ.data || { profileItems: 0, certifications: 0, readinessProducts: [] };
  const fullCatalog: any[] = catalogQ.data || [];
  const products: any[] = productsQ.data || [];

  // AI scan result + auto-trigger
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const lastScannedId = useRef<number | null>(null);

  useEffect(() => {
    if (selectedVehicleId && selectedVehicleId !== lastScannedId.current) {
      lastScannedId.current = selectedVehicleId;
      setScanResult(null);
      setScanLoading(true);
      scanMut.mutateAsync({ vehicleId: selectedVehicleId })
        .then((res: any) => { setScanResult(res); setScanLoading(false); })
        .catch(() => setScanLoading(false));
    }
  }, [selectedVehicleId]);

  // Mileage editing
  const [editingMileage, setEditingMileage] = useState(false);
  const [mileageInput, setMileageInput] = useState("");

  // Filter catalog to only show categories relevant to the selected vehicle type
  const catalog = useMemo(() => {
    if (!selectedVehicleId || !vehicleProfile.relevantCategories?.length) return fullCatalog;
    return fullCatalog.filter((cat: any) => vehicleProfile.relevantCategories.includes(cat.id));
  }, [fullCatalog, vehicleProfile.relevantCategories, selectedVehicleId]);

  // Local state for equipment editing
  const [editItems, setEditItems] = useState<Map<string, { available: boolean; specs?: Record<string, string>; condition?: string }>>(new Map());
  const [editCerts, setEditCerts] = useState<Set<string>>(new Set());
  const [profileDirty, setProfileDirty] = useState(false);

  // Initialize edit state from vehicle profile
  React.useEffect(() => {
    if (vehicleProfile?.items?.length > 0) {
      const m = new Map<string, any>();
      for (const item of vehicleProfile.items) {
        m.set(item.equipmentId, { available: item.available, specs: item.specs, condition: item.condition });
      }
      setEditItems(m);
      setEditCerts(new Set(vehicleProfile.certifications || []));
      setProfileDirty(false);
    } else if (selectedVehicleId) {
      setEditItems(new Map());
      setEditCerts(new Set());
      setProfileDirty(false);
    }
  }, [vehicleProfile, selectedVehicleId]);

  const toggleEquipment = (id: string) => {
    const m = new Map(editItems);
    const existing = m.get(id);
    if (existing) {
      m.set(id, { ...existing, available: !existing.available });
    } else {
      m.set(id, { available: true });
    }
    setEditItems(m);
    setProfileDirty(true);
  };

  const toggleCert = (id: string) => {
    const s = new Set(editCerts);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setEditCerts(s);
    setProfileDirty(true);
  };

  const saveProfile = async () => {
    if (!selectedVehicleId) return;
    const items = Array.from(editItems.entries()).map(([equipmentId, val]) => ({
      equipmentId,
      available: val.available,
      specs: val.specs,
      condition: val.condition as any,
    }));
    try {
      await saveMut.mutateAsync({ vehicleId: selectedVehicleId, items, certifications: Array.from(editCerts) });
      toast.success("Vehicle equipment saved");
      setProfileDirty(false);
      vehicleStatsQ.refetch?.();
      vehicleProfileQ.refetch?.();
      vehiclesQ.refetch?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const askAdvisor = async () => {
    if (!advisorQ.trim()) return;
    await advisorMut.mutateAsync({ question: advisorQ, productType: advisorProduct, trailerType: vehicleProfile.vehicleType });
    setAdvisorQ("");
  };

  const toggleCat = (catId: string) => {
    const s = new Set(expandedCats);
    if (s.has(catId)) s.delete(catId);
    else s.add(catId);
    setExpandedCats(s);
  };

  const selectVehicle = (id: number) => {
    setSelectedVehicleId(id);
    setTab("overview");
    setExpandedCats(new Set());
    setEditItems(new Map());
    setEditCerts(new Set());
    setProfileDirty(false);
    setScanResult(null);
    setEditingMileage(false);
  };

  const saveMileage = async () => {
    if (!selectedVehicleId || !mileageInput.trim()) return;
    const val = parseInt(mileageInput.replace(/,/g, ""), 10);
    if (isNaN(val) || val < 0) { toast.error("Invalid mileage"); return; }
    try {
      await updateDetailsMut.mutateAsync({ vehicleId: selectedVehicleId, mileage: val });
      toast.success("Mileage updated");
      setEditingMileage(false);
      vehicleProfileQ.refetch?.();
      vehiclesQ.refetch?.();
    } catch { toast.error("Failed to update mileage"); }
  };

  const rescan = () => {
    if (!selectedVehicleId) return;
    lastScannedId.current = null;
    setScanResult(null);
    setScanLoading(true);
    scanMut.mutateAsync({ vehicleId: selectedVehicleId })
      .then((res: any) => { setScanResult(res); setScanLoading(false); lastScannedId.current = selectedVehicleId; })
      .catch(() => setScanLoading(false));
  };

  // ─── Tabs ────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "AI Overview", icon: <ScanLine className="w-3.5 h-3.5" /> },
    { id: "profile", label: "Equipment", icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: "readiness", label: "Readiness", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: "catalog", label: "Catalog", icon: <Package className="w-3.5 h-3.5" /> },
    { id: "advisor", label: "AI Advisor", icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  // Readiness stats
  const readyCount = stats.readinessProducts?.filter((p: any) => p.readiness === "ready").length || 0;
  const partialCount = stats.readinessProducts?.filter((p: any) => p.readiness === "partial").length || 0;
  const bestScore = stats.readinessProducts?.length > 0 ? Math.max(...stats.readinessProducts.map((p: any) => p.score)) : 0;

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VEHICLE SELECTION GRID — shown when no vehicle is selected         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {!selectedVehicleId && (
        <>
          <div>
            <p className={cn("text-sm font-medium", mt)}>Select a tractor or trailer to manage its equipment profile</p>
          </div>

          {vehiclesQ.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : myVehicles.length === 0 ? (
            <Card className={cc}>
              <CardContent className="p-12 text-center">
                <Truck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className={cn("font-medium", vl)}>No vehicles in your fleet</p>
                <p className={cn("text-sm mt-1", mt)}>Add tractors and trailers from Fleet Command Center first</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Group vehicles: tractors first, then trailers */}
              {["tractor", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck", "trailer"].map(vType => {
                const group = myVehicles.filter(v => v.vehicleType === vType);
                if (group.length === 0) return null;
                const colors = VEHICLE_TYPE_COLORS[vType] || VEHICLE_TYPE_COLORS.trailer;
                return (
                  <div key={vType} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", colors.bg.replace("/15", ""))} />
                      <p className={cn("text-xs font-bold uppercase tracking-wider", mt)}>
                        {VEHICLE_TYPE_LABELS[vType] || vType} ({group.length})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.map((v: any) => (
                        <Card
                          key={v.id}
                          className={cn(cc, "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]")}
                          onClick={() => selectVehicle(v.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                                  <Truck className={cn("w-5 h-5", colors.icon)} />
                                </div>
                                <div>
                                  <p className={cn("font-semibold text-sm", vl)}>
                                    {v.make && v.model ? `${v.year || ''} ${v.make} ${v.model}`.trim() : `Vehicle #${v.id}`}
                                  </p>
                                  <p className={cn("text-xs", mt)}>{VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType}</p>
                                </div>
                              </div>
                              <Badge className={cn("text-[9px]",
                                v.status === "available" ? "bg-green-500/15 text-green-500" :
                                v.status === "in_use" ? "bg-blue-500/15 text-blue-500" :
                                v.status === "maintenance" ? "bg-yellow-500/15 text-yellow-500" :
                                "bg-red-500/15 text-red-500"
                              )}>
                                {v.status?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={cn("flex items-center gap-1", v.equipmentCount > 0 ? "text-blue-500" : mt)}>
                                <Wrench className="w-3 h-3" />{v.equipmentCount} items
                              </span>
                              <span className={cn("flex items-center gap-1", v.certificationCount > 0 ? "text-emerald-500" : mt)}>
                                <Award className="w-3 h-3" />{v.certificationCount} certs
                              </span>
                              {v.vin && <span className={cn("text-[10px]", mt)}>VIN: ...{v.vin.slice(-6)}</span>}
                            </div>
                            <div className="flex items-center justify-end mt-2">
                              <span className={cn("text-[10px] font-medium flex items-center gap-1", "text-blue-500")}>
                                Manage Equipment <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VEHICLE EQUIPMENT MANAGEMENT — shown when a vehicle is selected    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {selectedVehicleId && (
        <>
          {/* ── Back Button Row ── */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectedVehicleId(null); lastScannedId.current = null; }}
              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                L ? "border-slate-200 text-slate-500 hover:bg-slate-100" : "border-slate-700 text-slate-400 hover:bg-slate-700/50"
              )}
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" /> All Vehicles
            </button>
            <div className="flex items-center gap-2">
              {scanLoading && <div className="flex items-center gap-2 text-xs text-blue-500"><Loader2 className="w-3.5 h-3.5 animate-spin" />ESANG AI scanning...</div>}
              <button onClick={rescan} disabled={scanLoading} className={cn("p-2 rounded-xl border transition-all", L ? "border-slate-200 hover:bg-slate-100" : "border-slate-700 hover:bg-slate-700/50")}>
                <RefreshCw className={cn("w-4 h-4", scanLoading && "animate-spin")} />
              </button>
              {profileDirty && (
                <Button onClick={saveProfile} disabled={saveMut.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm">
                  {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Save
                </Button>
              )}
            </div>
          </div>

          {/* ── Rich Vehicle Detail Card ── */}
          <Card className={cc}>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Vehicle Identity */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                    (VEHICLE_TYPE_COLORS[vehicleProfile.vehicleType] || VEHICLE_TYPE_COLORS.trailer).bg
                  )}>
                    <Truck className={cn("w-7 h-7", (VEHICLE_TYPE_COLORS[vehicleProfile.vehicleType] || VEHICLE_TYPE_COLORS.trailer).icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={cn("text-lg font-bold truncate", vl)}>
                        {vehicleProfile.vehicleName || `Vehicle #${selectedVehicleId}`}
                      </h2>
                      <Badge className={cn("text-[10px] flex-shrink-0",
                        vehicleProfile.status === "available" ? "bg-green-500/15 text-green-500" :
                        vehicleProfile.status === "in_use" ? "bg-blue-500/15 text-blue-500" :
                        vehicleProfile.status === "maintenance" ? "bg-yellow-500/15 text-yellow-500" :
                        "bg-red-500/15 text-red-500"
                      )}>
                        {vehicleProfile.status?.replace(/_/g, " ") || "unknown"}
                      </Badge>
                    </div>
                    <p className={cn("text-xs font-medium mb-3", mt)}>
                      {VEHICLE_TYPE_LABELS[vehicleProfile.vehicleType] || vehicleProfile.vehicleType || "Vehicle"}
                    </p>

                    {/* VIN */}
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className={cn("text-xs font-mono tracking-wider", vl)}>{vehicleProfile.vin || "—"}</span>
                      <span className={cn("text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded", L ? "bg-slate-100 text-slate-400" : "bg-slate-700 text-slate-500")}>VIN</span>
                    </div>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-3">
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Make</p>
                        <p className={cn("text-sm font-semibold", vl)}>{vehicleProfile.make || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Model</p>
                        <p className={cn("text-sm font-semibold", vl)}>{vehicleProfile.model || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Year</p>
                        <p className={cn("text-sm font-semibold", vl)}>{vehicleProfile.year || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Mileage</p>
                        {editingMileage ? (
                          <div className="flex items-center gap-1">
                            <Input value={mileageInput} onChange={(e: any) => setMileageInput(e.target.value)}
                              placeholder="e.g. 125000" className="h-7 text-xs w-24 px-2" autoFocus
                              onKeyDown={(e: any) => { if (e.key === "Enter") saveMileage(); if (e.key === "Escape") setEditingMileage(false); }} />
                            <button onClick={saveMileage} className="text-green-500 hover:text-green-600"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingMileage(false)} className="text-slate-400 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <p className={cn("text-sm font-semibold cursor-pointer hover:text-blue-500 transition-colors", vl)}
                            onClick={() => { setEditingMileage(true); setMileageInput(vehicleProfile.mileage ? String(vehicleProfile.mileage) : ""); }}>
                            {vehicleProfile.mileage ? `${Number(vehicleProfile.mileage).toLocaleString()} mi` : <span className="text-blue-500 text-xs">+ Add</span>}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Plate</p>
                        <p className={cn("text-sm font-semibold", vl)}>{vehicleProfile.licensePlate || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Capacity</p>
                        <p className={cn("text-sm font-semibold", vl)}>{vehicleProfile.capacity || "—"}</p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Next Maintenance</p>
                        <p className={cn("text-sm font-semibold", vehicleProfile.nextMaintenanceDate ? vl : mt)}>
                          {vehicleProfile.nextMaintenanceDate ? new Date(vehicleProfile.nextMaintenanceDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", mt)}>Next Inspection</p>
                        <p className={cn("text-sm font-semibold", vehicleProfile.nextInspectionDate ? vl : mt)}>
                          {vehicleProfile.nextInspectionDate ? new Date(vehicleProfile.nextInspectionDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Quick stats */}
                <div className="flex md:flex-col gap-3 md:gap-2 flex-shrink-0">
                  {[
                    { label: "Equipment", value: stats.profileItems || 0, color: "text-blue-500" },
                    { label: "Certs", value: stats.certifications || 0, color: "text-emerald-500" },
                    { label: "Ready", value: readyCount, color: readyCount > 0 ? "text-green-500" : "text-slate-400" },
                    { label: "AI Score", value: scanResult?.sections?.safetyScore != null ? `${scanResult.sections.safetyScore}%` : "—", color: (scanResult?.sections?.safetyScore || 0) >= 70 ? "text-purple-500" : "text-yellow-500" },
                  ].map((s) => (
                    <div key={s.label} className={cn("text-center px-4 py-2 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                      <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                      <p className={cn("text-[9px] uppercase tracking-wider font-medium", mt)}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  tab === t.id
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                    : L ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: AI OVERVIEW — Auto-scan intelligence                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-4">
          {scanLoading ? (
            <div className="space-y-4">
              <Card className={cc}>
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 mb-4">
                    <ScanLine className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                  <p className={cn("font-bold text-sm mb-1", vl)}>ESANG AI Scanning Vehicle...</p>
                  <p className={cn("text-xs", mt)}>Decoding VIN, analyzing equipment, checking compliance, generating intelligence</p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>
              {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
          ) : scanResult?.error ? (
            <Card className={cc}>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className={cn("font-medium text-sm", vl)}>Scan unavailable</p>
                <p className={cn("text-xs mt-1", mt)}>{scanResult.error}</p>
                <Button onClick={rescan} className="mt-3 text-xs" variant="outline" size="sm">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Retry Scan
                </Button>
              </CardContent>
            </Card>
          ) : scanResult?.sections ? (
            <>
              {/* Executive Summary */}
              {scanResult.sections.vehicleSummary && (
                <Card className={cn(cc, "border-blue-500/30")}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className={cn("font-bold text-sm", vl)}>ESANG AI Vehicle Intelligence</p>
                          {scanResult.sections.safetyScore != null && (
                            <Badge className={cn("text-[10px]",
                              scanResult.sections.safetyScore >= 80 ? "bg-green-500/15 text-green-500" :
                              scanResult.sections.safetyScore >= 50 ? "bg-yellow-500/15 text-yellow-500" :
                              "bg-red-500/15 text-red-500"
                            )}>
                              Safety Score: {scanResult.sections.safetyScore}%
                            </Badge>
                          )}
                        </div>
                        <p className={cn("text-sm leading-relaxed", L ? "text-slate-600" : "text-slate-300")}>
                          {scanResult.sections.vehicleSummary}
                        </p>
                        {scanResult.sections.estimatedValue && (
                          <p className={cn("text-xs mt-2 font-medium", mt)}>
                            Est. Market Value: <span className={vl}>{scanResult.sections.estimatedValue}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VIN Decode */}
              {scanResult.sections.vinDecode && (
                <Card className={cc}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4 text-purple-500" />
                      <p className={cn("font-bold text-sm", vl)}>VIN Decode</p>
                    </div>
                    {scanResult.sections.vinDecode.summary && (
                      <p className={cn("text-xs mb-3 leading-relaxed", L ? "text-slate-600" : "text-slate-400")}>
                        {scanResult.sections.vinDecode.summary}
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(scanResult.sections.vinDecode)
                        .filter(([k, v]) => k !== "summary" && v && v !== "null" && v !== "Unknown")
                        .map(([k, v]) => (
                          <div key={k} className={cn("p-2.5 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                            <p className={cn("text-[9px] uppercase tracking-wider font-medium mb-0.5", mt)}>
                              {k.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className={cn("text-xs font-semibold", vl)}>{String(v)}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance Alerts */}
              {scanResult.sections.maintenanceAlerts?.length > 0 && (
                <Card className={cc}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <p className={cn("font-bold text-sm", vl)}>Maintenance Alerts</p>
                      <Badge className="text-[9px] bg-orange-500/15 text-orange-500">{scanResult.sections.maintenanceAlerts.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {scanResult.sections.maintenanceAlerts.map((a: any, i: number) => (
                        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            a.priority === "critical" ? "bg-red-500" : a.priority === "high" ? "bg-orange-500" : a.priority === "medium" ? "bg-yellow-500" : "bg-slate-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-xs font-semibold", vl)}>{a.title}</p>
                              <Badge className={cn("text-[8px]",
                                a.priority === "critical" ? "bg-red-500/15 text-red-500" :
                                a.priority === "high" ? "bg-orange-500/15 text-orange-500" :
                                "bg-yellow-500/15 text-yellow-500"
                              )}>{a.priority}</Badge>
                            </div>
                            <p className={cn("text-[11px] mt-0.5", mt)}>{a.detail}</p>
                            {a.mileageInterval && <p className={cn("text-[10px] mt-1 font-medium", mt)}>Every {Number(a.mileageInterval).toLocaleString()} mi</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Equipment Gaps */}
              {scanResult.sections.equipmentGaps?.length > 0 && (
                <Card className={cc}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className={cn("font-bold text-sm", vl)}>Equipment Gaps</p>
                      <Badge className="text-[9px] bg-red-500/15 text-red-500">
                        {scanResult.sections.equipmentGaps.filter((g: any) => g.severity === "critical").length} critical
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {scanResult.sections.equipmentGaps.map((g: any, i: number) => (
                        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                            g.severity === "critical" ? "bg-red-500/15" : g.severity === "warning" ? "bg-yellow-500/15" : "bg-blue-500/15"
                          )}>
                            {g.severity === "critical" ? <XCircle className="w-3 h-3 text-red-500" /> :
                             g.severity === "warning" ? <AlertTriangle className="w-3 h-3 text-yellow-500" /> :
                             <Info className="w-3 h-3 text-blue-500" />}
                          </div>
                          <div className="flex-1">
                            <p className={cn("text-xs font-semibold", vl)}>{g.item}</p>
                            <p className={cn("text-[11px]", mt)}>{g.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Recommended Equipment */}
                {scanResult.sections.recommendedEquipment?.length > 0 && (
                  <Card className={cc}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Wrench className="w-4 h-4 text-blue-500" />
                        <p className={cn("font-bold text-sm", vl)}>Recommended Equipment</p>
                      </div>
                      <div className="space-y-2">
                        {scanResult.sections.recommendedEquipment.map((r: any, i: number) => (
                          <div key={i} className={cn("p-2.5 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={cn("text-xs font-semibold", vl)}>{r.item}</p>
                              <Badge className={cn("text-[8px]",
                                r.priority === "required" ? "bg-red-500/15 text-red-500" :
                                r.priority === "recommended" ? "bg-yellow-500/15 text-yellow-500" :
                                "bg-slate-500/15 text-slate-400"
                              )}>{r.priority}</Badge>
                            </div>
                            <p className={cn("text-[10px]", mt)}>{r.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compliance Items */}
                {scanResult.sections.complianceItems?.length > 0 && (
                  <Card className={cc}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <p className={cn("font-bold text-sm", vl)}>Compliance Requirements</p>
                      </div>
                      <div className="space-y-2">
                        {scanResult.sections.complianceItems.map((c: any, i: number) => (
                          <div key={i} className={cn("p-2.5 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={cn("text-xs font-semibold", vl)}>{c.item}</p>
                              <Badge className={cn("text-[8px]",
                                c.status === "required" ? "bg-red-500/15 text-red-500" : "bg-yellow-500/15 text-yellow-500"
                              )}>{c.status}</Badge>
                            </div>
                            <p className={cn("text-[10px] font-medium", "text-blue-400")}>{c.regulation}</p>
                            <p className={cn("text-[10px]", mt)}>{c.detail}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <p className={cn("text-[10px] text-center", mt)}>
                Scanned by ESANG AI at {scanResult.scannedAt ? new Date(scanResult.scannedAt).toLocaleString() : "—"}
              </p>
            </>
          ) : (
            <Card className={cc}>
              <CardContent className="p-8 text-center">
                <ScanLine className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className={cn("font-medium text-sm", vl)}>No scan data yet</p>
                <Button onClick={rescan} className="mt-3 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm">
                  <ScanLine className="w-4 h-4 mr-2" />Scan Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MY EQUIPMENT */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "profile" && (
        <div className="space-y-4">
          <p className={cn("text-sm", mt)}>
            Check the equipment you have available. This builds your carrier equipment profile for load matching.
          </p>
          {vehicleProfileQ.isLoading || catalogQ.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : (
            catalog.map((cat: any) => (
              <Card key={cat.id} className={cc}>
                <button
                  onClick={() => toggleCat(cat.id)}
                  className={cn("w-full flex items-center justify-between p-4 text-left", L ? "hover:bg-slate-50" : "hover:bg-slate-700/30")}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", L ? "bg-blue-50" : "bg-blue-500/15")}>
                      {ICON_MAP[cat.icon] || <Package className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className={cn("font-bold text-sm", vl)}>{cat.name}</p>
                      <p className={cn("text-xs", mt)}>{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]", L ? "bg-slate-100 text-slate-600" : "bg-slate-700 text-slate-300")}>
                      {cat.items?.filter((i: any) => editItems.get(i.id)?.available).length || 0}/{cat.itemCount}
                    </Badge>
                    {expandedCats.has(cat.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedCats.has(cat.id) && (
                  <div className={cn("border-t px-4 pb-4 space-y-2", L ? "border-slate-100" : "border-slate-700/30")}>
                    {cat.items?.map((item: any) => {
                      const isOn = editItems.get(item.id)?.available || false;
                      const isCert = item.id.startsWith("cert_");
                      const checked = isCert ? editCerts.has(item.id) : isOn;
                      return (
                        <button
                          key={item.id}
                          onClick={() => isCert ? toggleCert(item.id) : toggleEquipment(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            checked
                              ? L ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/30"
                              : L ? "bg-slate-50 border border-slate-100 hover:border-slate-200" : "bg-slate-900/30 border border-slate-700/30 hover:border-slate-600/50"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                            checked
                              ? "bg-gradient-to-br from-[#1473FF] to-[#BE01FF]"
                              : L ? "bg-white border border-slate-300" : "bg-slate-800 border border-slate-600"
                          )}>
                            {checked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-sm", vl)}>{item.name}</p>
                            <p className={cn("text-xs truncate", mt)}>{item.description}</p>
                          </div>
                          <Badge className={cn("text-[9px] flex-shrink-0",
                            item.criticality === "required" ? "bg-red-500/15 text-red-500" :
                            item.criticality === "recommended" ? "bg-yellow-500/15 text-yellow-500" :
                            "bg-slate-500/15 text-slate-400"
                          )}>
                            {item.criticality}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: PRODUCT READINESS */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "readiness" && (
        <div className="space-y-4">
          <p className={cn("text-sm", mt)}>
            Your equipment readiness score for each product type. Higher scores mean better load matching.
          </p>
          {vehicleStatsQ.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
          ) : (
            <div className="grid gap-3">
              {(stats.readinessProducts || []).sort((a: any, b: any) => b.score - a.score).map((p: any) => {
                const scoreColor = p.score >= 80 ? "text-green-500" : p.score >= 50 ? "text-yellow-500" : "text-red-500";
                const barColor = p.score >= 80 ? "from-green-500 to-emerald-400" : p.score >= 50 ? "from-yellow-500 to-orange-400" : "from-red-500 to-pink-400";
                const readinessIcon = p.readiness === "ready" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                  p.readiness === "partial" ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> :
                  <XCircle className="w-5 h-5 text-red-500" />;
                return (
                  <Card key={p.productId} className={cc}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {readinessIcon}
                          <div>
                            <p className={cn("font-bold text-sm", vl)}>{p.productName}</p>
                            <p className={cn("text-xs", mt)}>{p.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", scoreColor)}>{p.score}%</p>
                          {p.criticalGaps > 0 && (
                            <p className="text-[10px] text-red-400 font-medium">{p.criticalGaps} critical gap{p.criticalGaps > 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                      <div className={cn("w-full h-2 rounded-full overflow-hidden", L ? "bg-slate-100" : "bg-slate-700/50")}>
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r transition-all", barColor)}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={cn("text-[10px]",
                          p.readiness === "ready" ? "bg-green-500/15 text-green-500" :
                          p.readiness === "partial" ? "bg-yellow-500/15 text-yellow-500" :
                          "bg-red-500/15 text-red-500"
                        )}>
                          {p.readiness === "ready" ? "Ready to Haul" : p.readiness === "partial" ? "Partial Match" : "Not Ready"}
                        </Badge>
                        <p className={cn("text-[10px]", mt)}>
                          {p.readiness === "ready" ? "All required equipment available" :
                           p.readiness === "partial" ? "Some equipment missing" :
                           "Missing critical equipment"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: EQUIPMENT CATALOG */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "catalog" && (
        <div className="space-y-4">
          <div className={cn("relative rounded-xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search equipment, hoses, fittings, certifications..."
              className={cn("pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0", L ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400")}
            />
          </div>

          {catalogQ.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : (
            catalog.map((cat: any) => {
              const filteredItems = searchTerm
                ? cat.items?.filter((i: any) =>
                    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    i.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                : cat.items;
              if (searchTerm && (!filteredItems || filteredItems.length === 0)) return null;
              return (
                <Card key={cat.id} className={cc}>
                  <button
                    onClick={() => toggleCat(`cat_${cat.id}`)}
                    className={cn("w-full flex items-center justify-between p-4 text-left", L ? "hover:bg-slate-50" : "hover:bg-slate-700/30")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15")}>
                        {ICON_MAP[cat.icon] || <Package className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", vl)}>{cat.name}</p>
                        <p className={cn("text-xs", mt)}>{filteredItems?.length || 0} items</p>
                      </div>
                    </div>
                    {expandedCats.has(`cat_${cat.id}`) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedCats.has(`cat_${cat.id}`) && (
                    <div className={cn("border-t px-4 pb-4 space-y-3 pt-3", L ? "border-slate-100" : "border-slate-700/30")}>
                      {(filteredItems || []).map((item: any) => (
                        <div key={item.id} className={cn("p-3 rounded-xl", L ? "bg-slate-50" : "bg-slate-900/30")}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn("font-medium text-sm", vl)}>{item.name}</p>
                            <Badge className={cn("text-[9px]",
                              item.criticality === "required" ? "bg-red-500/15 text-red-500" :
                              item.criticality === "recommended" ? "bg-yellow-500/15 text-yellow-500" :
                              "bg-slate-500/15 text-slate-400"
                            )}>
                              {item.criticality}
                            </Badge>
                          </div>
                          <p className={cn("text-xs mb-2", mt)}>{item.description}</p>
                          {item.specs && Object.keys(item.specs).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(item.specs).map(([key, vals]: [string, any]) => (
                                <span key={key} className={cn("text-[10px] px-2 py-0.5 rounded-full border",
                                  L ? "bg-white border-slate-200 text-slate-600" : "bg-slate-800 border-slate-600 text-slate-300"
                                )}>
                                  {key}: {Array.isArray(vals) ? vals.join(", ") : String(vals)}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.applicableProducts?.slice(0, 4).map((p: string) => (
                              <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                                {p.replace(/_/g, " ")}
                              </span>
                            ))}
                            {(item.applicableProducts?.length || 0) > 4 && (
                              <span className="text-[9px] text-slate-400">+{item.applicableProducts.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}

          {/* Product Profiles */}
          <h3 className={cn("text-sm font-bold mt-6", vl)}>Product Equipment Profiles</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {products.map((p: any) => (
              <Card key={p.productId} className={cc}>
                <CardContent className="p-4">
                  <p className={cn("font-bold text-sm mb-1", vl)}>{p.name}</p>
                  <p className={cn("text-xs mb-3", mt)}>{p.category}</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", "bg-red-500/15 text-red-500")}>
                      {p.requiredEquipmentCount} required
                    </span>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", "bg-yellow-500/15 text-yellow-500")}>
                      {p.recommendedEquipmentCount} recommended
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.typicalTrailers?.map((t: string) => (
                      <span key={t} className={cn("text-[9px] px-1.5 py-0.5 rounded border",
                        L ? "border-slate-200 text-slate-500" : "border-slate-600 text-slate-400"
                      )}>
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                  {p.notes && <p className={cn("text-[10px] mt-2 leading-relaxed", mt)}>{p.notes.slice(0, 150)}{p.notes.length > 150 ? "..." : ""}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TAB: AI ADVISOR */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "advisor" && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={cn("font-bold text-sm", vl)}>ESANG AI Equipment Advisor</p>
                  <p className={cn("text-xs", mt)}>Ask about hoses, fittings, site conditions, product requirements, or anything equipment-related</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={cn("text-xs font-medium", mt)}>Product context:</span>
                <select
                  value={advisorProduct}
                  onChange={(e) => setAdvisorProduct(e.target.value)}
                  className={cn("text-xs px-3 py-1.5 rounded-lg border", L ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600 text-white")}
                >
                  {products.map((p: any) => (
                    <option key={p.productId} value={p.productId}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={advisorQ}
                  onChange={(e: any) => setAdvisorQ(e.target.value)}
                  placeholder="e.g. Does the well have a LACT unit? What size hose do I need for crude oil at a tank battery? Do I need a PTO pump?"
                  className={cn("flex-1 rounded-xl text-sm resize-none", L ? "bg-slate-50 border-slate-200" : "bg-slate-900/40 border-slate-700 text-white placeholder:text-slate-500")}
                  rows={3}
                  onKeyDown={(e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAdvisor(); } }}
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  onClick={askAdvisor}
                  disabled={advisorMut.isPending || !advisorQ.trim()}
                  className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm"
                >
                  {advisorMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Ask ESANG AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example Questions */}
          <div className="flex flex-wrap gap-2">
            {[
              "What hose do I need for crude oil hauling?",
              "How many straps do I need for a flatbed load of lumber?",
              "What temp should I pre-cool my reefer for frozen food?",
              "Do I need a liftgate for residential dry van delivery?",
              "What equipment do I need for a steel coil load?",
              "What certifications do I need for food-grade bulk?",
              "Do I need a pilot car for my lowboy load?",
              "What blower CFM do I need for cement pneumatic offload?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setAdvisorQ(q); }}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  L ? "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50" :
                      "border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {/* AI Response */}
          {advisorMut.data && (
            <Card className={cc}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <p className={cn("font-bold text-sm", vl)}>ESANG AI Response</p>
                </div>
                <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", L ? "text-slate-700" : "text-slate-300")}>
                  {advisorMut.data.answer}
                </p>
                {advisorMut.data.recommendations?.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className={cn("text-xs font-bold uppercase tracking-wider", mt)}>Recommendations</p>
                    {advisorMut.data.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className={cn("text-xs", L ? "text-slate-600" : "text-slate-400")}>{r}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      </>)}
    </div>
  );
}

export default function EquipmentIntelligence() {
  return <EquipmentIntelligencePanel />;
}
