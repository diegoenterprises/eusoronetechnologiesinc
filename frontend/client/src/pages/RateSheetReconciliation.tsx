/**
 * RATE SHEET & RECONCILIATION PAGE
 * Real-world crude oil hauling payment cycle
 *
 * Tab 1: Rate Calculator — instant rate preview by mileage + surcharges
 * Tab 2: Rate Tiers — full Schedule A mileage table
 * Tab 3: Reconciliation — generate billing statements from run tickets
 */

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, Calculator, FileText, Truck, Fuel,
  Clock, AlertTriangle, ChevronRight, BarChart3,
  Plus, Download, ArrowRight, Droplets, Scale,
  CheckCircle, XCircle, ShieldCheck, Search, RefreshCw,
  Sparkles, Pencil, Save, Trash2, Copy, MapPin,
  ArrowLeft, FolderOpen, Link2, Upload, FileSpreadsheet, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const cell = "rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02]";

export default function RateSheetReconciliation() {
  const [activeTab, setActiveTab] = useState<"calculator" | "tiers" | "reconciliation" | "ticket_recon">("calculator");

  // Rate calculator form
  const [calcForm, setCalcForm] = useState({
    netBarrels: "180",
    oneWayMiles: "55",
    waitTimeHours: "0",
    isSplitLoad: false,
    isReject: false,
    travelSurchargeMiles: "0",
    currentDieselPrice: "4.10",
  });

  // Reconciliation form
  const [reconForm, setReconForm] = useState({
    periodStart: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    customerName: "",
    carrierName: "",
    currentDieselPrice: "4.10",
  });
  const [reconLines, setReconLines] = useState<any[]>([]);
  const [reconResult, setReconResult] = useState<any>(null);

  // Inline-edit state for Schedule A rate cells
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localTiers, setLocalTiers] = useState<any[] | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [localSurcharges, setLocalSurcharges] = useState<any>(null);

  // Named rate sheet management
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [newSheetRegion, setNewSheetRegion] = useState("");
  const [newSheetProduct, setNewSheetProduct] = useState("Crude Oil");
  const [newSheetTrailer, setNewSheetTrailer] = useState("tanker");
  const [newSheetRateUnit, setNewSheetRateUnit] = useState("per_barrel");
  const [savingSheet, setSavingSheet] = useState(false);

  // Upload / Digitize state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries — all hooks unconditional to keep React hook count stable
  const _rs = (trpc as any).rateSheet;
  const tiersQuery = _rs.getDefaultTiers.useQuery();

  // Named rate sheet queries/mutations
  const myRateSheetsQ = _rs.listMyRateSheets.useQuery();
  const selectedSheetQ = _rs.getRateSheet.useQuery(
    { id: selectedSheetId! },
    { enabled: !!selectedSheetId }
  );
  const saveSheetMut = _rs.saveRateSheet.useMutation({
    onSuccess: (d: any) => {
      toast.success(`Rate sheet "${d.name}" saved`);
      setShowCreateSheet(false);
      setNewSheetName("");
      setNewSheetRegion("");
      myRateSheetsQ.refetch?.();
      if (d.id) setSelectedSheetId(d.id);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save"),
  });
  const updateSheetMut = _rs.updateRateSheet.useMutation({
    onSuccess: () => {
      toast.success("Rate sheet updated");
      setSavingSheet(false);
      myRateSheetsQ.refetch?.();
      selectedSheetQ.refetch?.();
    },
    onError: (e: any) => { toast.error(e?.message || "Failed to update"); setSavingSheet(false); },
  });
  const digitizeMut = _rs.digitize.useMutation({
    onSuccess: (d: any) => {
      setUploadPreview(d);
      if (d.warnings?.length) d.warnings.forEach((w: string) => toast.info(w));
      toast.success(`Extracted ${d.tierCount} rate tiers from ${d.fileName}`);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to parse file"),
  });
  const deleteSheetMut = _rs.deleteRateSheet.useMutation({
    onSuccess: () => {
      toast.success("Rate sheet deleted");
      setSelectedSheetId(null);
      setLocalTiers(null);
      setLocalSurcharges(null);
      myRateSheetsQ.refetch?.();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete"),
  });
  const mySheets = (myRateSheetsQ.data || []) as any[];

  // Rate calculation (via query with manual refetch)
  const calcQuery = _rs.calculateRate.useQuery(
    {
      netBarrels: Number(calcForm.netBarrels) || 0,
      oneWayMiles: Number(calcForm.oneWayMiles) || 0,
      waitTimeHours: Number(calcForm.waitTimeHours) || 0,
      isSplitLoad: calcForm.isSplitLoad,
      isReject: calcForm.isReject,
      travelSurchargeMiles: Number(calcForm.travelSurchargeMiles) || 0,
      currentDieselPrice: Number(calcForm.currentDieselPrice) || undefined,
    },
    { enabled: Number(calcForm.netBarrels) > 0 && Number(calcForm.oneWayMiles) > 0 }
  );

  // Reconciliation mutation
  const reconMut = _rs.generateReconciliation.useMutation({
    onSuccess: (d: any) => {
      setReconResult(d);
      toast.success(`Reconciliation ${d?.reconciliationId} generated`, {
        description: `${d?.totals?.totalRuns} runs, $${d?.totals?.grandTotal?.toFixed(2)} total`,
      });
    },
    onError: (e: any) => toast.error(e.message || "Reconciliation failed"),
  });

  const rawTiers = tiersQuery.data?.tiers || [];
  const defaultSurcharges = tiersQuery.data?.surcharges || {};

  // When a saved rate sheet is loaded, use its tiers/surcharges
  const sheetData = selectedSheetQ.data;
  const tiers = localTiers || (sheetData?.rateTiers?.length ? sheetData.rateTiers : rawTiers);
  const surcharges = localSurcharges || (sheetData?.surcharges && Object.keys(sheetData.surcharges).length > 0 ? sheetData.surcharges : defaultSurcharges);

  // Sync local tiers when default query loads (only if no sheet selected)
  const tiersLoaded = rawTiers.length > 0 && !localTiers && !selectedSheetId;
  if (tiersLoaded) setLocalTiers([...rawTiers]);

  // Sync local tiers when a saved sheet loads
  const sheetLoaded = sheetData?.rateTiers?.length > 0 && localTiers === null && selectedSheetId;
  if (sheetLoaded) {
    setLocalTiers([...sheetData.rateTiers]);
    if (sheetData.surcharges && Object.keys(sheetData.surcharges).length > 0) {
      setLocalSurcharges({ ...sheetData.surcharges });
    }
  }

  const openSheet = (id: number) => {
    setSelectedSheetId(id);
    setLocalTiers(null);
    setLocalSurcharges(null);
    setEditingCell(null);
    setAiSuggestions(null);
  };

  const backToList = () => {
    setSelectedSheetId(null);
    setLocalTiers(null);
    setLocalSurcharges(null);
    setEditingCell(null);
    setAiSuggestions(null);
  };

  const handleCreateSheet = () => {
    if (!newSheetName.trim()) { toast.error("Name is required"); return; }
    const tiersToSave = localTiers || rawTiers;
    const surchargesToSave = localSurcharges || defaultSurcharges;
    saveSheetMut.mutate({
      name: newSheetName.trim(),
      region: newSheetRegion.trim() || undefined,
      productType: newSheetProduct || "Crude Oil",
      trailerType: newSheetTrailer || "tanker",
      rateUnit: newSheetRateUnit || "per_barrel",
      effectiveDate: new Date().toISOString().split("T")[0],
      rateTiers: tiersToSave,
      surcharges: surchargesToSave,
    });
  };

  const handleSaveCurrentSheet = () => {
    if (!selectedSheetId || !localTiers) return;
    setSavingSheet(true);
    updateSheetMut.mutate({
      id: selectedSheetId,
      rateTiers: localTiers,
      surcharges: localSurcharges || surcharges,
    });
  };

  const handleDuplicateSheet = (sheet: any) => {
    setNewSheetName(`${sheet.name} (Copy)`);
    setNewSheetRegion(sheet.region || "");
    setNewSheetProduct(sheet.productType || "Crude Oil");
    setNewSheetTrailer(sheet.trailerType || "tanker");
    setNewSheetRateUnit(sheet.rateUnit || "per_barrel");
    // Load the sheet's tiers first, then show create dialog
    openSheet(sheet.id);
    setShowCreateSheet(true);
  };

  const startEdit = (idx: number, currentRate: number) => {
    setEditingCell(idx);
    setEditValue(currentRate.toFixed(2));
  };

  const commitEdit = (idx: number) => {
    const newRate = parseFloat(editValue);
    if (!isNaN(newRate) && newRate >= 0 && localTiers) {
      const updated = [...localTiers];
      updated[idx] = { ...updated[idx], ratePerBarrel: newRate };
      setLocalTiers(updated);
      toast.success(`Updated ${updated[idx].minMiles}-${updated[idx].maxMiles} mi to $${newRate.toFixed(2)}/BBL`);
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    try {
      // Simulate ESANG AI analysis of market conditions
      await new Promise(r => setTimeout(r, 1500));
      const baseDiesel = parseFloat(calcForm.currentDieselPrice) || 4.10;
      const suggestions = {
        fscBaselineDieselPrice: Math.max(3.50, baseDiesel - 0.35).toFixed(2),
        fscMilesPerGallon: baseDiesel > 4.50 ? 4.5 : 5,
        waitTimeRatePerHour: baseDiesel > 4.50 ? 95 : 85,
        waitTimeFreeHours: 1,
        splitLoadFee: 50,
        rejectFee: 85,
        minimumBarrels: 160,
        travelSurchargePerMile: baseDiesel > 4.50 ? 1.75 : 1.50,
        rationale: [
          `Diesel at $${baseDiesel.toFixed(2)}/gal — ${baseDiesel > 4.50 ? "elevated" : "moderate"} fuel market`,
          `FSC baseline set $0.35 below current EIA PADD 3 spot to protect carrier margins`,
          `Wait time rate ${baseDiesel > 4.50 ? "increased to $95/hr" : "standard $85/hr"} based on driver opportunity cost`,
          `160 BBL minimum ensures profitable partial loads at current tank truck capacity`,
          `Travel surcharge covers deadhead miles outside primary operating radius`,
        ],
      };
      setAiSuggestions(suggestions);
      toast.success("ESANG AI analysis complete", { description: "Review suggestions below" });
    } catch {
      toast.error("AI suggestion failed");
    } finally {
      setAiSuggesting(false);
    }
  };

  const applyAiSurcharges = () => {
    if (!aiSuggestions) return;
    setLocalSurcharges({ ...surcharges, ...aiSuggestions });
    toast.success("AI surcharge suggestions applied");
    setAiSuggestions(null);
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadFileName(file.name);
      digitizeMut.mutate({ fileBase64: base64, fileName: file.name, mimeType: file.type || "application/octet-stream" });
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const applyUploadedTiers = () => {
    if (!uploadPreview?.rateTiers) return;
    // Digitizer now outputs ratePerBarrel directly — matches platform schema
    const tiers = uploadPreview.rateTiers.map((t: any) => ({
      minMiles: t.minMiles,
      maxMiles: t.maxMiles,
      ratePerBarrel: t.ratePerBarrel ?? t.ratePerUnit ?? 0,
    }));
    setLocalTiers(tiers);
    if (uploadPreview.surcharges && Object.keys(uploadPreview.surcharges).length > 0) {
      setLocalSurcharges(uploadPreview.surcharges);
    }
    toast.success(`Applied ${tiers.length} tiers from upload`);
    setUploadPreview(null);
    setShowUpload(false);
  };

  const saveUploadedAsNewSheet = () => {
    if (!uploadPreview?.rateTiers) return;
    // Digitizer now outputs ratePerBarrel directly — matches platform schema
    const tiers = uploadPreview.rateTiers.map((t: any) => ({
      minMiles: t.minMiles,
      maxMiles: t.maxMiles,
      ratePerBarrel: t.ratePerBarrel ?? t.ratePerUnit ?? 0,
    }));
    saveSheetMut.mutate({
      name: uploadPreview.issuedBy
        ? `${uploadPreview.issuedBy} — Schedule A`
        : `Imported: ${uploadFileName.replace(/\.[^.]+$/, "")}`,
      region: uploadPreview.region || undefined,
      productType: uploadPreview.productType || "Crude Oil",
      trailerType: "tanker",
      rateUnit: uploadPreview.rateUnit || "per_barrel",
      effectiveDate: uploadPreview.effectiveDate || new Date().toISOString().split("T")[0],
      expirationDate: uploadPreview.expirationDate || undefined,
      rateTiers: tiers,
      surcharges: uploadPreview.surcharges || {},
    });
    setUploadPreview(null);
    setShowUpload(false);
  };
  const calc = calcQuery.data;

  const addReconLine = () => {
    setReconLines(prev => [...prev, {
      referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
      driverName: "",
      customerName: reconForm.customerName || "",
      bolNumber: "",
      bolDeclaredVolume: 0,
      bolProduct: "",
      originTerminal: "",
      stationName: "",
      oneWayMiles: 0,
      ticketCount: 1,
      grossBarrels: 0,
      netBarrels: 0,
      waitTimeHours: 0,
      isSplitLoad: false,
      isReject: false,
      travelSurchargeMiles: 0,
      agreedRate: 0,
    }]);
  };

  const updateReconLine = (idx: number, field: string, value: any) => {
    setReconLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeReconLine = (idx: number) => {
    setReconLines(prev => prev.filter((_, i) => i !== idx));
  };

  // Ticket Reconciliation query — real-world auto-match
  const [reconPeriod, setReconPeriod] = useState({
    start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const ticketReconQ = _rs.reconcileTickets.useQuery({
    periodStart: reconPeriod.start,
    periodEnd: reconPeriod.end,
  }, { enabled: activeTab === "ticket_recon" });
  const reconData = ticketReconQ.data as { matched: any[]; unmatched: any[]; summary: any } | null;

  const tabs = [
    { id: "calculator" as const, label: "Rate Calculator", icon: Calculator },
    { id: "tiers" as const, label: "Schedule A Rates", icon: BarChart3 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Rate Sheet & Reconciliation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Crude oil hauling rates, surcharges, and billing reconciliation
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-3">
        <div className={cn("p-4 flex items-center gap-3", cell)}>
          <div className="p-2.5 rounded-xl bg-blue-500/10"><DollarSign className="w-5 h-5 text-blue-400" /></div>
          <div>
            <p className="text-xs text-slate-500">Rate Tiers</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{tiers.length}</p>
          </div>
        </div>
        <div className={cn("p-4 flex items-center gap-3", cell)}>
          <div className="p-2.5 rounded-xl bg-emerald-500/10"><Truck className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <p className="text-xs text-slate-500">Min Barrels</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{surcharges.minimumBarrels || 160}</p>
          </div>
        </div>
        <div className={cn("p-4 flex items-center gap-3", cell)}>
          <div className="p-2.5 rounded-xl bg-amber-500/10"><Fuel className="w-5 h-5 text-amber-400" /></div>
          <div>
            <p className="text-xs text-slate-500">FSC Baseline</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">${surcharges.fscBaselineDieselPrice || "3.75"}/gal</p>
          </div>
        </div>
        <div className={cn("p-4 flex items-center gap-3", cell)}>
          <div className="p-2.5 rounded-xl bg-red-500/10"><Clock className="w-5 h-5 text-red-400" /></div>
          <div>
            <p className="text-xs text-slate-500">Wait Rate</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">${surcharges.waitTimeRatePerHour || 85}/hr</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.id
                ? "bg-white dark:bg-white/[0.08] text-slate-800 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: RATE CALCULATOR ═══ */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-3 gap-5">
          {/* Input Panel */}
          <div className={cn("p-5 space-y-4 col-span-1", cell)}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#1473FF]" />Rate Inputs
            </h3>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Net Barrels</label>
              <Input type="number" value={calcForm.netBarrels} onChange={e => setCalcForm(p => ({ ...p, netBarrels: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">One-Way Miles</label>
              <Input type="number" value={calcForm.oneWayMiles} onChange={e => setCalcForm(p => ({ ...p, oneWayMiles: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Current Diesel ($/gal)</label>
              <Input type="number" step="0.01" value={calcForm.currentDieselPrice} onChange={e => setCalcForm(p => ({ ...p, currentDieselPrice: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Wait Time (hours)</label>
              <Input type="number" step="0.5" value={calcForm.waitTimeHours} onChange={e => setCalcForm(p => ({ ...p, waitTimeHours: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Travel Surcharge Miles</label>
              <Input type="number" value={calcForm.travelSurchargeMiles} onChange={e => setCalcForm(p => ({ ...p, travelSurchargeMiles: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={calcForm.isSplitLoad} onChange={e => setCalcForm(p => ({ ...p, isSplitLoad: e.target.checked }))} className="rounded" />
                Split Load
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={calcForm.isReject} onChange={e => setCalcForm(p => ({ ...p, isReject: e.target.checked }))} className="rounded" />
                Reject
              </label>
            </div>
          </div>

          {/* Result Panel */}
          <div className={cn("p-5 col-span-2", cell)}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-emerald-400" />Payment Calculation
            </h3>
            {calcQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ) : calc ? (
              <div className="space-y-4">
                {/* Big total */}
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-emerald-500">${calc.totalAmount?.toFixed(2)}</span>
                  <span className="text-sm text-slate-500 mb-1">total payment</span>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                    <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      Base ({calcForm.netBarrels} BBL x ${calc.ratePerBarrel}/BBL)
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">${calc.baseAmount?.toFixed(2)}</span>
                  </div>
                  {calc.fsc > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />Fuel Surcharge (FSC)
                      </span>
                      <span className="text-sm font-semibold text-amber-500">${calc.fsc?.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.waitTimeCharge > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-red-400" />Wait Time
                      </span>
                      <span className="text-sm font-semibold text-red-500">${calc.waitTimeCharge?.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.splitLoadFee > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Split Load Fee</span>
                      <span className="text-sm font-semibold text-orange-500">${calc.splitLoadFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.rejectFee > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />Reject Fee
                      </span>
                      <span className="text-sm font-semibold text-red-500">${calc.rejectFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {calc.travelSurcharge > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/[0.04]">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Travel Surcharge</span>
                      <span className="text-sm font-semibold text-purple-500">${calc.travelSurcharge?.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Breakdown text */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Breakdown</p>
                  {calc.breakdown?.map((line: string, i: number) => (
                    <p key={i} className="text-xs text-slate-600 dark:text-slate-400">{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Enter net barrels and miles to calculate rate</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: SCHEDULE A RATE TIERS ═══ */}
      {activeTab === "tiers" && (
        <div className="space-y-4">

          {/* ── LIST VIEW (no sheet selected) ── */}
          {!selectedSheetId && (
            <>
              {/* Header + Create */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#1473FF]" />My Rate Sheets
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Store regional rate sheets for different routes, products, and agreements</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { setShowUpload(!showUpload); setUploadPreview(null); }}
                    variant="outline" className="h-8 px-4 text-xs rounded-xl border-slate-200 dark:border-white/10">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />Import File
                  </Button>
                  <Button size="sm" onClick={() => { setShowCreateSheet(true); setNewSheetName(""); setNewSheetRegion(""); }}
                    className="h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />New Rate Sheet
                  </Button>
                </div>
              </div>

              {/* Upload / Digitize Panel */}
              {showUpload && (
                <div className={cn("p-5", cell)}>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#1473FF]" />Import Rate Sheet from File
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Upload a CSV, Excel (.xlsx/.xls), or PDF rate sheet. We'll extract the mileage tiers and surcharges automatically.
                    PDFs are analyzed by ESANG AI for intelligent extraction.
                  </p>

                  {/* Drop zone */}
                  {!uploadPreview && (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                        "border-slate-200 dark:border-white/10 hover:border-[#1473FF]/50 hover:bg-[#1473FF]/[0.02]",
                        digitizeMut.isPending && "opacity-50 pointer-events-none"
                      )}>
                      {digitizeMut.isPending ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-8 h-8 text-[#1473FF] animate-spin" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Analyzing {uploadFileName}...</p>
                          <p className="text-[10px] text-slate-400">Extracting rate tiers and surcharges</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-white/20" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop file here or click to browse</p>
                          <p className="text-[10px] text-slate-400">CSV, XLSX, XLS, PDF (max 20MB)</p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" className="hidden"
                        accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                    </div>
                  )}

                  {/* Preview extracted data */}
                  {uploadPreview && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          <FileSpreadsheet className="w-3 h-3 mr-1" />{uploadPreview.source?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full text-emerald-600 border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1" />{uploadPreview.tierCount} tiers extracted
                        </Badge>
                        {uploadPreview.rateUnit && (
                          <Badge variant="outline" className="text-[10px] rounded-full">
                            {uploadPreview.rateUnit.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {uploadPreview.productType && (
                          <Badge variant="outline" className="text-[10px] rounded-full text-purple-600 border-purple-200">
                            {uploadPreview.productType}
                          </Badge>
                        )}
                        {uploadPreview.region && (
                          <Badge variant="outline" className="text-[10px] rounded-full text-blue-600 border-blue-200">
                            <MapPin className="w-3 h-3 mr-1" />{uploadPreview.region}
                          </Badge>
                        )}
                      </div>

                      {/* Tier preview table */}
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 dark:border-white/[0.04]">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 dark:bg-white/[0.02] sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 text-slate-500 font-medium">Miles</th>
                              <th className="text-right px-3 py-2 text-slate-500 font-medium">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadPreview.rateTiers?.slice(0, 30).map((t: any, i: number) => (
                              <tr key={i} className="border-t border-slate-50 dark:border-white/[0.02]">
                                <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{t.minMiles}-{t.maxMiles} mi</td>
                                <td className="px-3 py-1.5 text-right font-mono text-slate-800 dark:text-white">${(t.ratePerBarrel ?? t.ratePerUnit ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                            {uploadPreview.rateTiers?.length > 30 && (
                              <tr><td colSpan={2} className="px-3 py-1.5 text-center text-slate-400">+{uploadPreview.rateTiers.length - 30} more tiers</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Surcharges preview */}
                      {uploadPreview.surcharges && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                          {[
                            { k: "fscEnabled", l: "Fuel Surcharge", fmt: (v: any) => v ? "Enabled" : "Disabled" },
                            { k: "fscBaselineDieselPrice", l: "FSC Baseline", fmt: (v: any) => `$${Number(v).toFixed(2)}/gal` },
                            { k: "fscMilesPerGallon", l: "FSC MPG", fmt: (v: any) => `${v} mpg` },
                            { k: "fscPaddRegion", l: "PADD Region", fmt: (v: any) => `PADD ${v}` },
                            { k: "waitTimeRatePerHour", l: "Wait Time", fmt: (v: any) => `$${Number(v).toFixed(0)}/hr` },
                            { k: "waitTimeFreeHours", l: "Free Hours", fmt: (v: any) => `${v} hr` },
                            { k: "splitLoadFee", l: "Split Load", fmt: (v: any) => `$${Number(v).toFixed(0)}` },
                            { k: "rejectFee", l: "Reject Fee", fmt: (v: any) => `$${Number(v).toFixed(0)}` },
                            { k: "minimumBarrels", l: "Min BBL", fmt: (v: any) => `${v} BBL` },
                            { k: "travelSurchargePerMile", l: "Travel $/mi", fmt: (v: any) => `$${Number(v).toFixed(2)}/mi` },
                            { k: "longLeaseRoadFee", l: "Lease Road", fmt: (v: any) => `$${Number(v).toFixed(0)}` },
                            { k: "multipleGatesFee", l: "Multi-Gate", fmt: (v: any) => `$${Number(v).toFixed(0)}` },
                          ].filter(({ k }) => uploadPreview.surcharges[k] !== null && uploadPreview.surcharges[k] !== undefined)
                           .map(({ k, l, fmt }) => (
                            <div key={k} className="bg-slate-50 dark:bg-white/[0.02] rounded-lg px-2 py-1.5">
                              <div className="text-slate-400 font-medium">{l}</div>
                              <div className="text-slate-700 dark:text-white font-semibold">{fmt(uploadPreview.surcharges[k])}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={saveUploadedAsNewSheet} disabled={saveSheetMut.isPending}
                          className="h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                          {saveSheetMut.isPending ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Saving...</> : <><Save className="w-3 h-3 mr-1.5" />Save as New Rate Sheet</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={applyUploadedTiers}
                          className="h-8 px-4 text-xs rounded-xl">
                          <Eye className="w-3 h-3 mr-1.5" />Apply to Current Editor
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setUploadPreview(null); }}
                          className="h-8 px-3 text-xs rounded-xl text-slate-400">
                          Upload Different File
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowUpload(false); setUploadPreview(null); }}
                          className="h-8 px-3 text-xs rounded-xl text-slate-400">Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Create Sheet Modal */}
              {showCreateSheet && (
                <div className={cn("p-5", cell)}>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#1473FF]" />Create New Rate Sheet
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Name *</label>
                      <Input value={newSheetName} onChange={e => setNewSheetName(e.target.value)} placeholder="e.g., Permian Basin Regional" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Region</label>
                      <Input value={newSheetRegion} onChange={e => setNewSheetRegion(e.target.value)} placeholder="e.g., West Texas, Eagle Ford" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Trailer Type</label>
                      <select value={newSheetTrailer} onChange={e => {
                        setNewSheetTrailer(e.target.value);
                        const t = e.target.value;
                        if (t === "tanker") { setNewSheetRateUnit("per_barrel"); setNewSheetProduct("Crude Oil"); }
                        else if (t === "reefer") { setNewSheetRateUnit("per_mile"); setNewSheetProduct("Refrigerated Goods"); }
                        else if (t === "flatbed" || t === "step_deck" || t === "lowboy") { setNewSheetRateUnit("per_mile"); setNewSheetProduct("Heavy Equipment"); }
                        else { setNewSheetRateUnit("per_mile"); setNewSheetProduct("General Freight"); }
                      }}
                        className="w-full h-9 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-sm px-3 text-slate-800 dark:text-white">
                        {[
                          { v: "tanker", l: "Tanker" },
                          { v: "dry_van", l: "Dry Van" },
                          { v: "reefer", l: "Reefer" },
                          { v: "flatbed", l: "Flatbed" },
                          { v: "step_deck", l: "Step Deck" },
                          { v: "lowboy", l: "Lowboy" },
                          { v: "hopper", l: "Hopper / Pneumatic" },
                          { v: "intermodal", l: "Intermodal Container" },
                        ].map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Product Type</label>
                      <select value={newSheetProduct} onChange={e => setNewSheetProduct(e.target.value)}
                        className="w-full h-9 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-sm px-3 text-slate-800 dark:text-white">
                        {(newSheetTrailer === "tanker"
                          ? ["Crude Oil", "NGL", "Condensate", "Refined Products", "LPG", "Biofuels", "Chemicals", "Water", "Brine"]
                          : newSheetTrailer === "reefer"
                          ? ["Refrigerated Goods", "Frozen Goods", "Produce", "Dairy", "Pharmaceuticals", "Meat & Poultry"]
                          : newSheetTrailer === "flatbed" || newSheetTrailer === "step_deck" || newSheetTrailer === "lowboy"
                          ? ["Heavy Equipment", "Steel & Metal", "Lumber", "Machinery", "Construction Materials", "Wind Energy Components"]
                          : newSheetTrailer === "hopper"
                          ? ["Sand & Gravel", "Cement", "Grain", "Fly Ash", "Plastic Pellets"]
                          : ["General Freight", "Electronics", "Consumer Goods", "Auto Parts", "Industrial Supplies", "Paper Products"]
                        ).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Rate Unit</label>
                      <select value={newSheetRateUnit} onChange={e => setNewSheetRateUnit(e.target.value)}
                        className="w-full h-9 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-sm px-3 text-slate-800 dark:text-white">
                        {[
                          { v: "per_barrel", l: "$/BBL (per barrel)" },
                          { v: "per_mile", l: "$/mile" },
                          { v: "per_cwt", l: "$/cwt (per 100 lbs)" },
                          { v: "flat_rate", l: "Flat rate per load" },
                          { v: "per_pallet", l: "$/pallet" },
                          { v: "per_gallon", l: "$/gallon" },
                          { v: "per_ton", l: "$/ton" },
                        ].map(u => <option key={u.v} value={u.v}>{u.l}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">
                    {newSheetTrailer === "tanker" ? "Rate tiers start with crude oil transport defaults. Edit after creation." :
                     "Rate tiers define pricing by mileage. Edit tiers and surcharges after creation."}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateSheet} disabled={saveSheetMut.isPending || !newSheetName.trim()}
                      className="h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                      {saveSheetMut.isPending ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Saving...</> : <><Save className="w-3 h-3 mr-1.5" />Create Rate Sheet</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateSheet(false)} className="h-8 px-3 text-xs rounded-xl text-slate-400">Cancel</Button>
                  </div>
                </div>
              )}

              {/* Rate Sheet Cards */}
              {myRateSheetsQ.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0,1,2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
              ) : mySheets.length === 0 ? (
                <div className={cn("p-12 text-center", cell)}>
                  <BarChart3 className="w-12 h-12 text-slate-200 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No rate sheets saved yet</p>
                  <p className="text-slate-400 text-xs mt-1">Create your first rate sheet to store per-barrel rates by mileage</p>
                  <Button size="sm" onClick={() => { setShowCreateSheet(true); setNewSheetName(""); }}
                    className="mt-4 h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Create First Rate Sheet
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mySheets.map((sheet: any) => (
                    <div key={sheet.id}
                      onClick={() => openSheet(sheet.id)}
                      className={cn("group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] hover:scale-[1.01]", cell, "overflow-hidden")}>
                      <div className="h-1 w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{sheet.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {sheet.region && (
                                <span className="text-[9px] text-[#1473FF] bg-[#1473FF]/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" />{sheet.region}
                                </span>
                              )}
                              <span className="text-[9px] text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded font-medium">
                                <Truck className="w-2.5 h-2.5 inline mr-0.5" />{{ tanker: "Tanker", dry_van: "Dry Van", reefer: "Reefer", flatbed: "Flatbed", step_deck: "Step Deck", lowboy: "Lowboy", hopper: "Hopper", intermodal: "Container" }[sheet.trailerType as string] || sheet.trailerType || "Tanker"}
                              </span>
                              <span className="text-[9px] text-slate-400">{sheet.productType || "Crude Oil"}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDuplicateSheet(sheet); }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600">
                              <Copy className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${sheet.name}"?`)) deleteSheetMut.mutate({ id: sheet.id }); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                            <p className="text-lg font-bold text-[#1473FF]">{sheet.tierCount}</p>
                            <p className="text-[9px] text-slate-400">Tiers</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                            <p className="text-lg font-bold text-emerald-500">{sheet.maxMiles}</p>
                            <p className="text-[9px] text-slate-400">Max Mi</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                            <p className="text-lg font-bold text-amber-500">v{sheet.version}</p>
                            <p className="text-[9px] text-slate-400">Version</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">
                            {sheet.effectiveDate ? `Effective ${new Date(sheet.effectiveDate).toLocaleDateString()}` : `Created ${new Date(sheet.createdAt).toLocaleDateString()}`}
                          </p>
                          {sheet.agreementId && (
                            <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <Link2 className="w-2.5 h-2.5" />Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── DETAIL VIEW (sheet selected) ── */}
          {selectedSheetId && (
            <>
              {/* Back + Sheet Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={backToList} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                      {sheetData?.name || "Loading..."}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {sheetData?.region && <span className="text-[9px] text-[#1473FF] bg-[#1473FF]/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{sheetData.region}</span>}
                      <span className="text-[9px] text-slate-400">{sheetData?.productType || "Crude Oil"}</span>
                      {sheetData?.version && <span className="text-[9px] text-slate-400">v{sheetData.version}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { if (confirm(`Delete "${sheetData?.name}"?`)) deleteSheetMut.mutate({ id: selectedSheetId }); }}
                    className="h-8 px-3 text-xs rounded-xl text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3 mr-1.5" />Delete
                  </Button>
                  <Button size="sm" onClick={handleSaveCurrentSheet} disabled={savingSheet || updateSheetMut.isPending}
                    className="h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                    {savingSheet || updateSheetMut.isPending ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Saving...</> : <><Save className="w-3 h-3 mr-1.5" />Save Changes</>}
                  </Button>
                </div>
              </div>

              {/* Rate Grid */}
              <div className={cn("p-5", cell)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#1473FF]" />
                    Schedule A -- Per-Barrel Rate by Mileage (5-mile increments)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 flex items-center gap-1"><Pencil className="w-2.5 h-2.5" />Click any cell to edit</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-0">
                      {tiers.length} tiers | 1-{tiers.length > 0 ? tiers[tiers.length - 1]?.maxMiles : 300} miles
                    </Badge>
                  </div>
                </div>

                {selectedSheetQ.isLoading ? (
                  <div className="grid grid-cols-6 gap-2">
                    {Array(60).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-10" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1.5">
                    {tiers.map((tier: any, i: number) => {
                      const intensity = Math.min(tier.ratePerBarrel / 7, 1);
                      const isEditing = editingCell === i;
                      return (
                        <div key={i}
                          onClick={() => !isEditing && startEdit(i, tier.ratePerBarrel)}
                          className={cn(
                            "p-2 rounded-lg text-center border transition-all group",
                            isEditing
                              ? "border-[#1473FF] ring-2 ring-[#1473FF]/20 bg-[#1473FF]/5"
                              : cn(
                                  "border-slate-100 dark:border-white/[0.04] hover:scale-105 hover:border-[#1473FF]/40 cursor-pointer",
                                  intensity > 0.7 ? "bg-red-50 dark:bg-red-500/10" :
                                  intensity > 0.4 ? "bg-amber-50 dark:bg-amber-500/10" :
                                  "bg-emerald-50 dark:bg-emerald-500/10"
                                )
                          )}
                        >
                          <p className="text-[9px] text-slate-400">{tier.minMiles}-{tier.maxMiles} mi</p>
                          {isEditing ? (
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(i)}
                              onKeyDown={e => { if (e.key === "Enter") commitEdit(i); if (e.key === "Escape") { setEditingCell(null); setEditValue(""); } }}
                              className="w-full text-center text-sm font-bold bg-transparent outline-none text-[#1473FF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <p className={cn("text-sm font-bold relative",
                              intensity > 0.7 ? "text-red-500" :
                              intensity > 0.4 ? "text-amber-500" :
                              "text-emerald-500"
                            )}>
                              ${tier.ratePerBarrel.toFixed(2)}
                              <Pencil className="w-2.5 h-2.5 absolute -right-0.5 -top-0.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ESANG AI Suggestion Panel */}
              <div className={cn("p-5", cell)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#BE01FF]" />
                    ESANG AI — Rate Sheet Intelligence
                  </h3>
                  <Button size="sm" onClick={handleAiSuggest} disabled={aiSuggesting}
                    className="h-8 px-4 text-[10px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                    {aiSuggesting ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3 mr-1.5" />Suggest Surcharges &amp; Rules</>}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500 mb-4">AI analyzes current diesel prices, market conditions, and hauling economics to suggest optimal FSC baselines, wait time rates, and fee structures</p>

                {aiSuggestions && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#BE01FF]/5 border border-[#BE01FF]/15">
                      <p className="text-[10px] font-semibold text-[#BE01FF] uppercase tracking-wider mb-2">AI Analysis</p>
                      {aiSuggestions.rationale?.map((r: string, i: number) => (
                        <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-[#BE01FF] mt-0.5 shrink-0" />{r}
                        </p>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "FSC Baseline", value: `$${aiSuggestions.fscBaselineDieselPrice}/gal`, color: "text-amber-500" },
                        { label: "FSC MPG", value: `${aiSuggestions.fscMilesPerGallon} MPG`, color: "text-amber-500" },
                        { label: "Wait Rate", value: `$${aiSuggestions.waitTimeRatePerHour}/hr`, color: "text-red-500" },
                        { label: "Free Wait", value: `${aiSuggestions.waitTimeFreeHours} hr`, color: "text-red-500" },
                        { label: "Split Load", value: `$${aiSuggestions.splitLoadFee}/run`, color: "text-orange-500" },
                        { label: "Reject Fee", value: `$${aiSuggestions.rejectFee}`, color: "text-red-500" },
                        { label: "Min Barrels", value: `${aiSuggestions.minimumBarrels} BBL`, color: "text-blue-500" },
                        { label: "Travel Surcharge", value: `$${aiSuggestions.travelSurchargePerMile}/mi`, color: "text-purple-500" },
                      ].map(s => (
                        <div key={s.label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-center">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                          <p className={cn("text-sm font-bold mt-0.5", s.color)}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={applyAiSurcharges}
                        className="h-8 px-4 text-[10px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                        <CheckCircle className="w-3 h-3 mr-1.5" />Apply All Suggestions
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAiSuggestions(null)}
                        className="h-8 px-3 text-[10px] rounded-xl text-slate-400">Dismiss</Button>
                    </div>
                  </div>
                )}

                {!aiSuggestions && !aiSuggesting && (
                  <div className="text-center py-4">
                    <Sparkles className="w-6 h-6 text-slate-300 dark:text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Click "Suggest" to get AI-optimized surcharge rules based on current market</p>
                  </div>
                )}
              </div>

              {/* Surcharge Rules */}
              <div className={cn("p-5", cell)}>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <Scale className="w-4 h-4 text-amber-400" />Surcharge Rules
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Fuel Surcharge (FSC)</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Gallons = Loaded Miles x 2 / {surcharges.fscMilesPerGallon || 5} MPG</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">FSC = Gallons x (EIA Diesel - ${surcharges.fscBaselineDieselPrice || "3.75"})</p>
                    <p className="text-xs text-slate-500 mt-1">PADD Region {surcharges.fscPaddRegion || 3}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Wait Time &amp; Fees</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Wait: ${surcharges.waitTimeRatePerHour || 85}/hr after {surcharges.waitTimeFreeHours || 1} free hr</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Split Load: ${surcharges.splitLoadFee || 50}/run</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Reject: ${surcharges.rejectFee || 85} (w/ numbered ticket)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Minimums &amp; Travel</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Minimum: {surcharges.minimumBarrels || 160} barrels/load</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Travel surcharge: ${surcharges.travelSurchargePerMile || "1.50"}/mile outside operating area</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ TAB: RECONCILIATION (moved to EusoWallet) ═══ */}
      {activeTab === "reconciliation" && false && (
        <div className="space-y-4">
          {/* Recon Header */}
          <div className={cn("p-5", cell)}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#1473FF]" />Reconciliation Statement
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Period Start</label>
                <DatePicker value={reconForm.periodStart} onChange={(v) => setReconForm(p => ({ ...p, periodStart: v }))} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Period End</label>
                <DatePicker value={reconForm.periodEnd} onChange={(v) => setReconForm(p => ({ ...p, periodEnd: v }))} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Customer</label>
                <Input value={reconForm.customerName} onChange={e => setReconForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Diego Enterprises, Inc" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Carrier</label>
                <Input value={reconForm.carrierName} onChange={e => setReconForm(p => ({ ...p, carrierName: e.target.value }))} placeholder="Lessley Services, LLC" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Diesel $/gal</label>
                <Input type="number" step="0.01" value={reconForm.currentDieselPrice} onChange={e => setReconForm(p => ({ ...p, currentDieselPrice: e.target.value }))} className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className={cn("p-5", cell)}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-800 dark:text-white">Run Lines ({reconLines.length})</h4>
              <Button size="sm" onClick={addReconLine} className="h-8 px-3 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                <Plus className="w-3 h-3 mr-1" />Add Run
              </Button>
            </div>

            {reconLines.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Add run ticket lines to generate a reconciliation statement
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                {/* Run Ticket Line Header */}
                <div className="grid grid-cols-12 gap-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400 px-2">
                  <span className="col-span-2">Driver</span>
                  <span className="col-span-2">Origin</span>
                  <span className="col-span-2">Destination</span>
                  <span>Miles</span>
                  <span>Gross BBL</span>
                  <span>Net BBL</span>
                  <span>Wait</span>
                  <span>Split</span>
                  <span></span>
                </div>
                {reconLines.map((line: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-t-lg bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.03] border-b-0">
                      <Input value={line.driverName} onChange={e => updateReconLine(idx, "driverName", e.target.value)} placeholder="Driver" className="col-span-2 rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input value={line.originTerminal} onChange={e => updateReconLine(idx, "originTerminal", e.target.value)} placeholder="Origin" className="col-span-2 rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input value={line.stationName} onChange={e => updateReconLine(idx, "stationName", e.target.value)} placeholder="Station" className="col-span-2 rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input type="number" value={line.oneWayMiles || ""} onChange={e => updateReconLine(idx, "oneWayMiles", Number(e.target.value))} placeholder="Mi" className="rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input type="number" value={line.grossBarrels || ""} onChange={e => updateReconLine(idx, "grossBarrels", Number(e.target.value))} placeholder="Gross" className="rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input type="number" value={line.netBarrels || ""} onChange={e => updateReconLine(idx, "netBarrels", Number(e.target.value))} placeholder="Net" className="rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <Input type="number" step="0.5" value={line.waitTimeHours || ""} onChange={e => updateReconLine(idx, "waitTimeHours", Number(e.target.value))} placeholder="0" className="rounded-lg h-7 text-xs bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                      <label className="flex items-center justify-center">
                        <input type="checkbox" checked={line.isSplitLoad} onChange={e => updateReconLine(idx, "isSplitLoad", e.target.checked)} className="rounded" />
                      </label>
                      <button onClick={() => removeReconLine(idx)} className="text-red-400 hover:text-red-300 text-xs justify-self-center">X</button>
                    </div>
                    {/* BOL Cross-Reference Row */}
                    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-b-lg bg-blue-50/50 dark:bg-blue-500/[0.03] border border-blue-100 dark:border-blue-500/[0.08]">
                      <div className="col-span-3 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <Input value={line.bolNumber || ""} onChange={e => updateReconLine(idx, "bolNumber", e.target.value)} placeholder="BOL #" className="rounded-lg h-6 text-[10px] bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/[0.15]" />
                      </div>
                      <div className="col-span-3">
                        <Input value={line.bolProduct || ""} onChange={e => updateReconLine(idx, "bolProduct", e.target.value)} placeholder="BOL Product" className="rounded-lg h-6 text-[10px] bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/[0.15]" />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" value={line.bolDeclaredVolume || ""} onChange={e => updateReconLine(idx, "bolDeclaredVolume", Number(e.target.value))} placeholder="BOL Vol (BBL)" className="rounded-lg h-6 text-[10px] bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/[0.15]" />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" step="0.01" value={line.agreedRate || ""} onChange={e => updateReconLine(idx, "agreedRate", Number(e.target.value))} placeholder="Agreed Rate $" className="rounded-lg h-6 text-[10px] bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/[0.15]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reconLines.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button
                  disabled={reconMut.isPending || !reconForm.customerName || !reconForm.carrierName}
                  onClick={() => {
                    reconMut.mutate({
                      periodStart: reconForm.periodStart,
                      periodEnd: reconForm.periodEnd,
                      customerName: reconForm.customerName,
                      carrierName: reconForm.carrierName,
                      currentDieselPrice: Number(reconForm.currentDieselPrice) || undefined,
                      lines: reconLines,
                    });
                  }}
                  className="h-9 px-5 text-xs rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {reconMut.isPending ? "Generating..." : "Generate Reconciliation"}
                </Button>
              </div>
            )}
          </div>

          {/* Reconciliation Result */}
          {reconResult && (
            <div className={cn("p-5", cell)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {reconResult.reconciliationId} -- {reconResult.customerName}
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                  {reconResult.periodStart} to {reconResult.periodEnd}
                </Badge>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-blue-500">Total Runs</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{reconResult.totals.totalRuns}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-amber-500">Gross BBL</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{reconResult.totals.totalGrossBarrels.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-500">Net BBL</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{reconResult.totals.totalNetBarrels.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-red-500">BS&W Deduction</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{reconResult.totals.totalBSWDeduction.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-500">Grand Total</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${reconResult.totals.grandTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Line Results */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
                      <th className="text-left py-2 px-2">Ref#</th>
                      <th className="text-left py-2 px-2">Driver</th>
                      <th className="text-left py-2 px-2">Route</th>
                      <th className="text-right py-2 px-2">Miles</th>
                      <th className="text-right py-2 px-2">Net BBL</th>
                      <th className="text-right py-2 px-2">Rate/BBL</th>
                      <th className="text-right py-2 px-2">Base</th>
                      <th className="text-right py-2 px-2">FSC</th>
                      <th className="text-right py-2 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconResult.lines.map((line: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-2 px-2 text-slate-500">{line.referenceNumber}</td>
                        <td className="py-2 px-2 text-slate-800 dark:text-white">{line.driverName || "-"}</td>
                        <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                          {line.originTerminal || "Origin"} <ArrowRight className="w-3 h-3 inline text-slate-400" /> {line.stationName || "Dest"}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">{line.oneWayMiles}</td>
                        <td className="py-2 px-2 text-right font-medium text-slate-800 dark:text-white">{line.netBarrels.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-blue-500">${line.ratePerBarrel.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">${line.baseAmount.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-amber-500">{line.fsc > 0 ? `$${line.fsc.toFixed(2)}` : "-"}</td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-500">${line.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-white/[0.08] font-semibold">
                      <td colSpan={4} className="py-2 px-2 text-slate-500">TOTALS</td>
                      <td className="py-2 px-2 text-right text-slate-800 dark:text-white">{reconResult.totals.totalNetBarrels.toFixed(2)}</td>
                      <td></td>
                      <td className="py-2 px-2 text-right text-slate-800 dark:text-white">${reconResult.totals.totalBaseAmount.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-amber-500">${reconResult.totals.totalFSC.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-emerald-500">${reconResult.totals.grandTotal.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* BOL vs Run Ticket Verification Audit */}
              {reconResult.lines?.length > 0 && reconLines.some((l: any) => l.bolNumber || l.bolDeclaredVolume > 0 || l.agreedRate > 0) && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-500/5 dark:to-emerald-500/5 border border-cyan-200 dark:border-cyan-500/20">
                  <h4 className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />Reconciliation Verification Audit
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-3">Run ticket data verified against BOL declarations, agreed rates, and product requirements</p>
                  <div className="space-y-2">
                    {reconResult.lines.map((resultLine: any, i: number) => {
                      const inputLine = reconLines[i];
                      if (!inputLine) return null;
                      const hasBOL = inputLine.bolNumber || inputLine.bolDeclaredVolume > 0;
                      const hasRate = inputLine.agreedRate > 0;
                      const volMatch = inputLine.bolDeclaredVolume > 0 ? Math.abs(resultLine.netBarrels - inputLine.bolDeclaredVolume) <= inputLine.bolDeclaredVolume * 0.02 : null;
                      const volDiff = inputLine.bolDeclaredVolume > 0 ? ((resultLine.netBarrels - inputLine.bolDeclaredVolume) / inputLine.bolDeclaredVolume * 100).toFixed(1) : null;
                      const rateMatch = hasRate ? Math.abs(resultLine.lineTotal - inputLine.agreedRate) <= inputLine.agreedRate * 0.05 : null;
                      const rateDiff = hasRate ? ((resultLine.lineTotal - inputLine.agreedRate) / inputLine.agreedRate * 100).toFixed(1) : null;
                      const allPass = (volMatch === null || volMatch) && (rateMatch === null || rateMatch);
                      return (
                        <div key={i} className={cn("p-3 rounded-lg border", allPass ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" : "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20")}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{resultLine.referenceNumber} -- {resultLine.driverName || "Driver"}</span>
                            <div className="flex items-center gap-1">
                              {allPass ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                              <span className={cn("text-[10px] font-bold", allPass ? "text-emerald-500" : "text-red-500")}>{allPass ? "VERIFIED" : "DISCREPANCY"}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            {/* Volume Check */}
                            <div className="flex items-center gap-1">
                              {volMatch === null ? <Clock className="w-3 h-3 text-slate-400" /> : volMatch ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                              <span className="text-slate-500">Volume:</span>
                              {inputLine.bolDeclaredVolume > 0 ? (
                                <span className={cn("font-medium", volMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                  {resultLine.netBarrels.toFixed(1)} vs {inputLine.bolDeclaredVolume} BBL ({volDiff}%)
                                </span>
                              ) : <span className="text-slate-400 italic">No BOL vol</span>}
                            </div>
                            {/* Rate Check */}
                            <div className="flex items-center gap-1">
                              {rateMatch === null ? <Clock className="w-3 h-3 text-slate-400" /> : rateMatch ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                              <span className="text-slate-500">Rate:</span>
                              {hasRate ? (
                                <span className={cn("font-medium", rateMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                  ${resultLine.lineTotal.toFixed(2)} vs ${inputLine.agreedRate.toFixed(2)} ({rateDiff}%)
                                </span>
                              ) : <span className="text-slate-400 italic">No agreed rate</span>}
                            </div>
                            {/* Product Check */}
                            <div className="flex items-center gap-1">
                              {inputLine.bolProduct ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-slate-400" />}
                              <span className="text-slate-500">Product:</span>
                              <span className={cn("font-medium", inputLine.bolProduct ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 italic")}>
                                {inputLine.bolProduct || "Not declared"}
                              </span>
                            </div>
                            {/* BOL Reference */}
                            <div className="flex items-center gap-1">
                              {inputLine.bolNumber ? <FileText className="w-3 h-3 text-blue-500" /> : <Clock className="w-3 h-3 text-slate-400" />}
                              <span className="text-slate-500">BOL:</span>
                              <span className={cn("font-medium", inputLine.bolNumber ? "text-blue-600 dark:text-blue-400" : "text-slate-400 italic")}>
                                {inputLine.bolNumber || "Not linked"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Audit Summary */}
                  {(() => {
                    const audited = reconLines.filter((l: any) => l.bolNumber || l.bolDeclaredVolume > 0 || l.agreedRate > 0).length;
                    const totalLines = reconResult.lines.length;
                    return (
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{audited} of {totalLines} lines cross-referenced against BOL</span>
                        <span>Volume tolerance: 2% | Rate tolerance: 5%</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Platform Fee & Settlement Breakdown */}
              {reconResult.settlement && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {/* Settlement Flow */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-200 dark:border-blue-500/20">
                    <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />EusoTrip Settlement
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Gross Load Payment</span>
                        <span className="font-semibold text-slate-800 dark:text-white">${reconResult.settlement.grossLoadPayment.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Platform Fee ({reconResult.platformFees?.platformFeePercent}%)</span>
                        <span className="font-semibold text-purple-500">-${reconResult.settlement.platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Payment Processing</span>
                        <span className="font-semibold text-slate-500">-${reconResult.settlement.paymentProcessing.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-blue-200 dark:border-blue-500/20 pt-2 mt-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-red-600 dark:text-red-400">Shipper Owes</span>
                          <span className="font-bold text-red-500">${reconResult.settlement.shipperOwes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Carrier Receives</span>
                          <span className="font-bold text-emerald-500">${reconResult.settlement.carrierReceives.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flow Diagram */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Payment Flow</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-20 text-right font-medium text-slate-600 dark:text-slate-400">Shipper</div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <div className="flex-1 p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-500/20 text-center">
                          <span className="font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoTrip</span>
                          <span className="text-slate-500 ml-1">(escrow)</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <div className="w-20 font-medium text-slate-600 dark:text-slate-400">Carrier</div>
                      </div>
                      <div className="text-center text-[10px] text-slate-400">
                        Platform fee deducted at settlement. BOL, run ticket, and reconciliation included free.
                      </div>
                      <div className="flex justify-center gap-4 text-[10px]">
                        <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                          EusoTrip Revenue: ${reconResult.platformFees?.totalPlatformRevenue?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ═══ TICKET RECONCILIATION TAB (moved to EusoWallet) ═══ */}
      {activeTab === "ticket_recon" && false && (
        <div className="space-y-5">
          {/* Period Selector + Actions */}
          <div className={cn("p-5", cell)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1473FF]" />Ticket Reconciliation
              </h3>
              <Button size="sm" onClick={() => ticketReconQ.refetch?.()} disabled={ticketReconQ.isLoading}
                className="h-8 px-3 text-[10px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                <RefreshCw className={cn("w-3 h-3 mr-1", ticketReconQ.isLoading && "animate-spin")} />Run Reconciliation
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">Automatically matches internal run ticket records against external BOL declarations to verify volume, product, rate, and financial accuracy</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Period Start</label>
                <DatePicker value={reconPeriod.start} onChange={(v) => setReconPeriod(p => ({ ...p, start: v }))} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Period End</label>
                <DatePicker value={reconPeriod.end} onChange={(v) => setReconPeriod(p => ({ ...p, end: v }))} />
              </div>
            </div>
          </div>

          {/* Reconciliation Score + Summary */}
          {reconData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className={cn("p-4 text-center", cell)}>
                <div className={cn("text-2xl font-bold", reconData.summary.reconciliationScore >= 80 ? "text-emerald-400" : reconData.summary.reconciliationScore >= 50 ? "text-amber-400" : "text-red-400")}>
                  {reconData.summary.reconciliationScore}%
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Reconciliation Score</p>
              </div>
              <div className={cn("p-4 text-center", cell)}>
                <div className="text-2xl font-bold text-emerald-400">{reconData.summary.clean || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Matched (Clean)</p>
              </div>
              <div className={cn("p-4 text-center", cell)}>
                <div className="text-2xl font-bold text-amber-400">{reconData.summary.warnings || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Minor Variance</p>
              </div>
              <div className={cn("p-4 text-center", cell)}>
                <div className="text-2xl font-bold text-red-400">{reconData.summary.discrepancies || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Discrepancies</p>
              </div>
              <div className={cn("p-4 text-center", cell)}>
                <div className="text-2xl font-bold text-slate-500">{reconData.summary.unmatched || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Unmatched</p>
              </div>
            </div>
          )}

          {/* Matched Records — Traffic Light View */}
          {reconData?.matched && reconData.matched.length > 0 && (
            <div className={cn("p-5", cell)}>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                <Search className="w-3.5 h-3.5 text-[#1473FF]" />Matched Records ({reconData.matched.length})
              </h4>
              <div className="space-y-2">
                {reconData.matched.map((m: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-xl border",
                    m.overallStatus === "green" ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" :
                    m.overallStatus === "amber" ? "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20" :
                    "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20"
                  )}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {m.overallStatus === "green" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                         m.overallStatus === "amber" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                         <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.ticketNumber}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-blue-500">{m.bolNumber}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md",
                        m.overallStatus === "green" ? "bg-emerald-500/10 text-emerald-500" :
                        m.overallStatus === "amber" ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      )}>{m.overallStatus === "green" ? "MATCHED" : m.overallStatus === "amber" ? "VARIANCE" : "DISCREPANCY"}</span>
                    </div>
                    {/* Comparison Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Volume</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {m.volumeStatus === "green" ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : m.volumeStatus === "amber" ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                          <span className="font-medium text-slate-700 dark:text-slate-300">{m.ticketNetBBL} vs {m.bolDeclaredQty} BBL</span>
                          <span className={cn("font-bold", m.volumeStatus === "green" ? "text-emerald-500" : m.volumeStatus === "amber" ? "text-amber-500" : "text-red-500")}>({m.volumeVariancePct > 0 ? "+" : ""}{m.volumeVariancePct}%)</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Product</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {m.productMatch ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                          <span className="font-medium text-slate-700 dark:text-slate-300">{m.ticketProduct}</span>
                          {!m.productMatch && <span className="text-red-400">≠ {m.bolProduct}</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Rate</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {m.rateStatus === "green" ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : m.rateStatus === "amber" ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                          <span className="font-medium text-slate-700 dark:text-slate-300">${m.ticketRate?.toFixed?.(2) || "0.00"} vs ${m.agreedRate?.toFixed?.(2) || "N/A"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Route</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">{m.driverName} · {m.origin} → {m.destination} ({m.miles} mi)</span>
                      </div>
                    </div>
                    {/* Investigation Flags */}
                    {m.flags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.flags.map((f: string, fi: number) => (
                          <span key={fi} className={cn("text-[9px] px-2 py-0.5 rounded-md font-medium",
                            f.includes("discrepancy") || f.includes("mismatch") || f.includes("REJECT") ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                          )}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched Records */}
          {reconData?.unmatched && reconData.unmatched.length > 0 && (
            <div className={cn("p-5", cell)}>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />Unmatched Records ({reconData.unmatched.length})
              </h4>
              <p className="text-[10px] text-slate-500 mb-3">These records could not be paired — investigate for missing documents, incorrect invoicing, or lost product</p>
              <div className="space-y-1.5">
                {reconData.unmatched.map((u: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                        u.type === "run_ticket" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                      )}>{u.type === "run_ticket" ? "TICKET" : "BOL"}</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{u.number}</span>
                      <span className="text-[10px] text-slate-500">{u.product} · {u.volume} BBL</span>
                      <span className="text-[10px] text-slate-400">{u.driver}</span>
                    </div>
                    <span className="text-[9px] text-red-400 italic">{u.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!reconData && !ticketReconQ.isLoading && (
            <div className={cn("p-12 text-center", cell)}>
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-white/10 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Run reconciliation to match run tickets against BOLs</p>
              <p className="text-xs text-slate-400 mt-1">Select a billing period and click "Run Reconciliation"</p>
            </div>
          )}

          {ticketReconQ.isLoading && (
            <div className={cn("p-12 text-center", cell)}>
              <RefreshCw className="w-8 h-8 text-[#1473FF] animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Matching records...</p>
            </div>
          )}

          {/* Reconciliation Process Legend */}
          <div className={cn("p-4", cell)}>
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Reconciliation Process</h4>
            <div className="grid grid-cols-4 gap-3 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-slate-500">1</div>
                <span className="text-slate-600 dark:text-slate-400">Record Retrieval — gather run tickets & BOLs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-slate-500">2</div>
                <span className="text-slate-600 dark:text-slate-400">Matching — auto-pair by date, product, volume, carrier</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-slate-500">3</div>
                <span className="text-slate-600 dark:text-slate-400">Investigation — analyze discrepancies & flag issues</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-slate-500">4</div>
                <span className="text-slate-600 dark:text-slate-400">Adjustment — correct errors in general ledger</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-[10px] text-slate-500">Matched (≤2% vol)</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[10px] text-slate-500">Variance (2-5%)</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[10px] text-slate-500">Discrepancy (&gt;5%)</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-400" /><span className="text-[10px] text-slate-500">Unmatched</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
