import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
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
  Copy, Trash2, Lock, Settings, Wrench, LayoutList, ListChecks,
  Filter, ChevronRight, Calendar,
} from "lucide-react";

/* ─── Constants ─── */

const ENTRY_TYPES = [
  "Rate", "Accessorial Rate", "Destination Wait Rate", "Fuel Surcharge Rate",
  "Min Settle Units", "Order Reject Rate", "Origin Wait Rate", "Rate Sheet",
  "Settlement Rate", "Time Card Fee Parameter", "Wait Fee Parameter",
  "Hazmat Surcharge", "Deadhead Rate", "Detention Rate", "Layover Rate",
  "Stop-Off Charge", "Loading Fee", "Unloading Fee", "Reefer Surcharge",
  "Overweight Surcharge", "Toll Pass-Through", "Border Crossing Fee",
  "Escort Rate", "Tanker Endorsement Premium",
] as const;

const SETTLEMENT_TYPES = ["Shipper", "Carrier", "Driver"] as const;

const RATE_TYPES = [
  { value: "flat", label: "Flat" },
  { value: "per_mile", label: "Per Mile" },
  { value: "per_barrel", label: "Per BBL" },
  { value: "per_ton", label: "Per Ton" },
  { value: "per_gallon", label: "Per Gallon" },
] as const;

const RATE_TYPE_LABELS: Record<string, string> = {
  per_mile: "Per Mile", flat: "Flat", per_barrel: "Per BBL",
  per_gallon: "Per Gallon", per_ton: "Per Ton",
};

const UOM_OPTIONS = ["Barrel", "Gallon", "Ton", "Lbs", "Units", "Head", "TEU"] as const;

const TRUCK_TYPES = [
  "(ALL)", "Dry Van", "Reefer", "Flatbed", "Step Deck", "Lowboy",
  "Tanker", "Hopper", "Pneumatic", "Hotshot", "Box Truck", "Straight Truck",
  "Car Hauler", "Conestoga", "Dump Truck", "Curtainside", "Container",
  "Double Drop", "RGN", "Power Only", "Sprinter Van", "Bobtail",
] as const;

const PRODUCT_GROUPS = [
  "(ALL)", "Crude Oil", "Refined Petroleum", "Natural Gas", "Chemicals",
  "Agriculture / Grain", "Livestock", "Produce (Fresh)", "Produce (Frozen)",
  "Building Materials", "Steel / Metals", "Lumber", "Machinery / Equipment",
  "Auto Parts", "Vehicles", "Electronics", "Consumer Goods", "Hazardous Materials",
  "Pharmaceuticals", "Food & Beverage", "Textiles", "Paper / Cardboard",
  "Sand / Gravel / Aggregate", "Coal", "Waste / Recyclables",
] as const;

const US_STATES = [
  "(ALL)", "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
] as const;

const REGIONS = [
  "(ALL)", "Northeast", "Southeast", "Midwest", "Southwest", "West Coast",
  "Pacific Northwest", "Gulf Coast", "Great Plains", "Mountain West",
  "Mid-Atlantic", "New England", "South Central",
] as const;

const CARRIER_TYPES = [
  "(ALL)", "Asset-Based", "Owner-Operator", "Broker Carrier", "Dedicated",
  "Intermodal", "LTL", "Specialized", "Expedited",
] as const;

const REASON_OPTIONS = [
  "(ALL)", "Standard", "Emergency", "Seasonal", "Contract", "Spot",
  "Promotional", "Override", "Penalty",
] as const;

type PriceBook = {
  id: number;
  name: string;
  settlementType: string;
  isCurrent: boolean;
  isLocked: boolean;
  lockedThrough: string;
  effectiveDate: string;
  endDate: string;
  shipper: string;
  carrierType: string;
  carrier: string;
  driverGroup: string;
  driver: string;
};

type PBEntry = {
  id: number;
  priceBookId: number;
  entryType: string;
  accessorialType: string;
  shipper: string;
  carrierType: string;
  carrier: string;
  driverGroup: string;
  driver: string;
  truckType: string;
  productGroup: string;
  destination: string;
  origin: string;
  destinationState: string;
  originState: string;
  destinationRegion: string;
  originRegion: string;
  producer: string;
  reason: string;
  rateType: string;
  rate: number;
  uom: string;
  pbStart: string;
  effectiveDate: string;
  endDate: string;
  pbEnd: string;
};

const TABS = [
  { key: "pricebooks", label: "Price Books", icon: BookOpen },
  { key: "details", label: "Price Book Details", icon: LayoutList },
  { key: "settlement", label: "Settlement", icon: DollarSign },
  { key: "configuration", label: "Configuration", icon: Settings },
  { key: "tools", label: "Tools", icon: Wrench },
] as const;

type TabKey = typeof TABS[number]["key"];

/* ─── Helper: Select Dropdown ─── */
function SelectField({ label, value, onChange, options, isLight, className }: {
  label: string; value: string; onChange: (v: string) => void;
  options: readonly string[] | string[]; isLight: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className={cn("text-[10px] uppercase font-semibold mb-1 block tracking-wider",
        isLight ? "text-slate-500" : "text-slate-400"
      )}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "w-full h-8 text-xs rounded-md border px-2 appearance-none",
          isLight
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-white/[0.04] border-white/[0.08] text-white"
        )}
      >
        {options.map(o => <option key={o} value={o === "(ALL)" ? "" : o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", isLight, className }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; isLight: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className={cn("text-[10px] uppercase font-semibold mb-1 block tracking-wider",
        isLight ? "text-slate-500" : "text-slate-400"
      )}>{label}</label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn("h-8 text-xs",
          isLight
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-white/[0.04] border-white/[0.08] text-white"
        )}
      />
    </div>
  );
}

/* ─── Default entry form state ─── */
const defaultEntryForm = (): PBEntry => ({
  id: 0, priceBookId: 0,
  entryType: "Rate", accessorialType: "",
  shipper: "", carrierType: "", carrier: "",
  driverGroup: "", driver: "",
  truckType: "", productGroup: "",
  destination: "", origin: "",
  destinationState: "", originState: "",
  destinationRegion: "", originRegion: "",
  producer: "", reason: "",
  rateType: "flat", rate: 0, uom: "Barrel",
  pbStart: new Date().toISOString().split("T")[0],
  effectiveDate: new Date().toISOString().split("T")[0],
  endDate: "", pbEnd: "",
});

const defaultPBForm = (): Omit<PriceBook, "id"> => ({
  name: "", settlementType: "Shipper",
  isCurrent: true, isLocked: false, lockedThrough: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  endDate: "", shipper: "", carrierType: "",
  carrier: "", driverGroup: "", driver: "",
});

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

export default function Pricebook() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();

  /* ─── Tab state ─── */
  const [activeTab, setActiveTab] = useState<TabKey>("pricebooks");

  /* ─── Price Books list state (local, since backend doesn't have PB groups yet) ─── */
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([
    { id: 1, name: "Standard Shipper PB 2026", settlementType: "Shipper", isCurrent: true, isLocked: false, lockedThrough: "", effectiveDate: "2026-01-01", endDate: "2026-12-31", shipper: "(ALL)", carrierType: "(ALL)", carrier: "(ALL)", driverGroup: "(ALL)", driver: "(ALL)" },
    { id: 2, name: "Standard Carrier PB 2026", settlementType: "Carrier", isCurrent: true, isLocked: false, lockedThrough: "", effectiveDate: "2026-01-01", endDate: "2026-12-31", shipper: "(ALL)", carrierType: "(ALL)", carrier: "(ALL)", driverGroup: "(ALL)", driver: "(ALL)" },
    { id: 3, name: "Standard Driver PB 2026", settlementType: "Driver", isCurrent: true, isLocked: false, lockedThrough: "", effectiveDate: "2026-01-01", endDate: "2026-12-31", shipper: "(ALL)", carrierType: "(ALL)", carrier: "(ALL)", driverGroup: "(ALL)", driver: "(ALL)" },
  ]);
  const [selectedPB, setSelectedPB] = useState<PriceBook | null>(null);
  const [pbSearch, setPbSearch] = useState("");
  const [pbFilter, setPbFilter] = useState<string>("all");
  const [showPBModal, setShowPBModal] = useState(false);
  const [pbForm, setPbForm] = useState<Omit<PriceBook, "id">>(defaultPBForm());
  const [editingPBId, setEditingPBId] = useState<number | null>(null);

  /* ─── Price Book Entries (local state, maps to backend entries) ─── */
  const [pbEntries, setPbEntries] = useState<PBEntry[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState<PBEntry>(defaultEntryForm());
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [entrySearch, setEntrySearch] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>("all");

  /* ─── tRPC queries (existing backend) ─── */
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [historyEntryId, setHistoryEntryId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRate, setEditRate] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");

  const [legacyForm, setLegacyForm] = useState({
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
    onSuccess: () => { toast.success("Rate entry created"); entriesQuery.refetch(); },
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
      setShowImport(false); setImportCsv(""); entriesQuery.refetch();
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

  /* ─── Filtered Price Books ─── */
  const filteredPBs = useMemo(() => {
    return priceBooks.filter(pb => {
      if (pbFilter !== "all" && pb.settlementType !== pbFilter) return false;
      if (pbSearch && !pb.name.toLowerCase().includes(pbSearch.toLowerCase())) return false;
      return true;
    });
  }, [priceBooks, pbFilter, pbSearch]);

  /* ─── Filtered PB Entries ─── */
  const filteredEntries = useMemo(() => {
    return pbEntries.filter(e => {
      if (selectedPB && e.priceBookId !== selectedPB.id) return false;
      if (entryTypeFilter !== "all" && e.entryType !== entryTypeFilter) return false;
      if (entrySearch) {
        const s = entrySearch.toLowerCase();
        return e.entryType.toLowerCase().includes(s) ||
          e.origin.toLowerCase().includes(s) ||
          e.destination.toLowerCase().includes(s) ||
          e.shipper.toLowerCase().includes(s) ||
          e.carrier.toLowerCase().includes(s);
      }
      return true;
    });
  }, [pbEntries, selectedPB, entryTypeFilter, entrySearch]);

  /* ─── PB CRUD ─── */
  const nextPBId = () => Math.max(0, ...priceBooks.map(p => p.id)) + 1;
  const savePB = () => {
    if (!pbForm.name.trim()) { toast.error("Name is required"); return; }
    if (editingPBId) {
      setPriceBooks(prev => prev.map(p => p.id === editingPBId ? { ...p, ...pbForm } : p));
      toast.success("Price book updated");
    } else {
      setPriceBooks(prev => [...prev, { id: nextPBId(), ...pbForm }]);
      toast.success("Price book created");
    }
    setShowPBModal(false);
    setEditingPBId(null);
    setPbForm(defaultPBForm());
  };
  const deletePB = (id: number) => {
    setPriceBooks(prev => prev.filter(p => p.id !== id));
    setPbEntries(prev => prev.filter(e => e.priceBookId !== id));
    if (selectedPB?.id === id) setSelectedPB(null);
    toast.success("Price book deleted");
  };
  const duplicatePB = (pb: PriceBook) => {
    const newId = nextPBId();
    setPriceBooks(prev => [...prev, { ...pb, id: newId, name: `${pb.name} (Copy)`, isCurrent: false }]);
    const newEntries = pbEntries
      .filter(e => e.priceBookId === pb.id)
      .map((e, i) => ({ ...e, id: Date.now() + i, priceBookId: newId }));
    setPbEntries(prev => [...prev, ...newEntries]);
    toast.success("Price book duplicated");
  };

  /* ─── Entry CRUD ─── */
  const nextEntryId = () => Math.max(0, ...pbEntries.map(e => e.id)) + 1;
  const saveEntry = () => {
    if (!selectedPB) { toast.error("Select a price book first"); return; }
    if (editingEntryId) {
      setPbEntries(prev => prev.map(e => e.id === editingEntryId ? { ...entryForm, id: editingEntryId } : e));
      toast.success("Entry updated");
    } else {
      setPbEntries(prev => [...prev, { ...entryForm, id: nextEntryId(), priceBookId: selectedPB.id }]);
      toast.success("Entry added");
    }
    setShowEntryModal(false);
    setEditingEntryId(null);
    setEntryForm(defaultEntryForm());
  };
  const deleteEntry = (id: number) => {
    setPbEntries(prev => prev.filter(e => e.id !== id));
    toast.success("Entry deleted");
  };

  /* Also create entries from backend into the new system on the backend/tools tab */
  const syncLegacyEntry = () => {
    if (!legacyForm.entryName.trim()) { toast.error("Entry name required"); return; }
    createMut.mutate(legacyForm);
  };

  /* ─── Style helpers ─── */
  const bg = isLight ? "bg-white" : "bg-slate-950";
  const bgSub = isLight ? "bg-slate-50" : "bg-slate-900/50";
  const bgCard = isLight ? "bg-white border-slate-200" : "bg-slate-900 border-white/[0.08]";
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-600" : "text-slate-300";
  const textMuted = isLight ? "text-slate-400" : "text-slate-500";
  const borderColor = isLight ? "border-slate-200" : "border-white/[0.06]";
  const hoverRow = isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]";
  const inputBg = isLight ? "bg-white border-slate-200 text-slate-900" : "bg-white/[0.04] border-white/[0.08] text-white";
  const tabActive = isLight
    ? "bg-white text-amber-700 border-b-2 border-amber-500 shadow-sm"
    : "bg-white/[0.06] text-amber-400 border-b-2 border-amber-400";
  const tabInactive = isLight
    ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
    : "text-slate-400 hover:text-white hover:bg-white/[0.04]";
  const badgeSettlement: Record<string, string> = {
    Shipper: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/10 text-blue-400",
    Carrier: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/10 text-emerald-400",
    Driver: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/10 text-purple-400",
  };

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */

  return (
    <div className={cn("flex flex-col h-[calc(100vh-64px)] overflow-hidden", bg, textPrimary)}>

      {/* ─── Top Header ─── */}
      <div className={cn("flex items-center justify-between px-4 py-3 shrink-0", borderColor, "border-b", bgSub)}>
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-bold">Pricebook</h1>
          <Badge className={cn("border-0 text-[10px]", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/10 text-amber-400")}>
            3-Tier System
          </Badge>
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className={cn("flex items-center gap-0.5 px-4 pt-1 shrink-0", borderColor, "border-b", bgSub)}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all",
                activeTab === tab.key ? tabActive : tabInactive
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: PRICE BOOKS ═══ */}
      {activeTab === "pricebooks" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className={cn("flex items-center justify-between px-4 py-2.5 shrink-0", borderColor, "border-b")}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5", textMuted)} />
                <Input value={pbSearch} onChange={e => setPbSearch(e.target.value)} placeholder="Search price books..."
                  className={cn("h-8 w-56 pl-7 text-xs", inputBg)} />
              </div>
              <div className={cn("flex items-center gap-0.5 p-0.5 rounded-lg", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                {["all", "Shipper", "Carrier", "Driver"].map(f => (
                  <button key={f} onClick={() => setPbFilter(f)}
                    className={cn("px-3 py-1.5 text-[11px] font-medium rounded-md transition-all",
                      pbFilter === f
                        ? (isLight ? "bg-white text-slate-900 shadow-sm" : "bg-white/[0.1] text-white")
                        : (isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")
                    )}>
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className={cn("h-8 px-3 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
                onClick={() => { setEditingPBId(null); setPbForm(defaultPBForm()); setShowPBModal(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1" />New Price Book
              </Button>
            </div>
          </div>

          {/* Price Books Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className={cn("text-[10px] uppercase tracking-wider", textMuted, borderColor, "border-b", bgSub)}>
                  <th className="px-3 py-2.5 text-left w-10">Current</th>
                  <th className="px-3 py-2.5 text-left">Settlement Type</th>
                  <th className="px-3 py-2.5 text-left">Name</th>
                  <th className="px-3 py-2.5 text-left">Locked Through</th>
                  <th className="px-3 py-2.5 text-left">Effective</th>
                  <th className="px-3 py-2.5 text-left">End</th>
                  <th className="px-3 py-2.5 text-left">Shipper</th>
                  <th className="px-3 py-2.5 text-left">Carrier Type</th>
                  <th className="px-3 py-2.5 text-left">Carrier</th>
                  <th className="px-3 py-2.5 text-left">Driver Group</th>
                  <th className="px-3 py-2.5 text-left">Driver</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPBs.length === 0 ? (
                  <tr><td colSpan={12} className={cn("px-3 py-16 text-center", textMuted)}>
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium mb-1">No price books found</p>
                    <p className="text-[11px] opacity-60">Create your first price book to get started</p>
                  </td></tr>
                ) : filteredPBs.map(pb => (
                  <tr key={pb.id}
                    className={cn("transition-colors cursor-pointer", borderColor, "border-b", hoverRow,
                      selectedPB?.id === pb.id && (isLight ? "bg-amber-50" : "bg-amber-500/[0.04]")
                    )}
                    onClick={() => { setSelectedPB(pb); setActiveTab("details"); }}
                  >
                    <td className="px-3 py-2.5 text-center">
                      {pb.isCurrent
                        ? <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,.4)]" />
                        : <span className={cn("inline-block w-2.5 h-2.5 rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")} />}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className={cn("border-0 text-[10px] font-semibold", badgeSettlement[pb.settlementType])}>
                        {pb.settlementType}
                      </Badge>
                    </td>
                    <td className={cn("px-3 py-2.5 font-medium", textPrimary)}>
                      <div className="flex items-center gap-2">
                        {pb.name}
                        {pb.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                      </div>
                    </td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.lockedThrough || "---"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.effectiveDate}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.endDate || "---"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.shipper || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.carrierType || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.carrier || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.driverGroup || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{pb.driver || "(ALL)"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button className={cn("p-1 rounded", isLight ? "hover:bg-slate-100 text-slate-400 hover:text-slate-700" : "hover:bg-white/[0.06] text-slate-400 hover:text-white")}
                          onClick={() => { setEditingPBId(pb.id); setPbForm({ ...pb }); setShowPBModal(true); }} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className={cn("p-1 rounded", isLight ? "hover:bg-slate-100 text-slate-400 hover:text-blue-600" : "hover:bg-white/[0.06] text-slate-400 hover:text-blue-400")}
                          onClick={() => duplicatePB(pb)} title="Duplicate">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className={cn("p-1 rounded", isLight ? "hover:bg-red-50 text-slate-400 hover:text-red-600" : "hover:bg-red-500/10 text-slate-400 hover:text-red-400")}
                          onClick={() => deletePB(pb.id)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={cn("flex items-center justify-between px-4 py-2 text-xs shrink-0", borderColor, "border-t", bgSub)}>
            <span className={textMuted}>{filteredPBs.length} price book{filteredPBs.length !== 1 ? "s" : ""}</span>
            <div className="flex gap-4">
              {SETTLEMENT_TYPES.map(st => {
                const count = priceBooks.filter(p => p.settlementType === st).length;
                return <span key={st} className={textMuted}><span className="text-amber-500 font-semibold">{count}</span> {st}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: PRICE BOOK DETAILS ═══ */}
      {activeTab === "details" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Selected PB Info Bar */}
          <div className={cn("flex items-center justify-between px-4 py-2.5 shrink-0", borderColor, "border-b")}>
            <div className="flex items-center gap-3">
              {selectedPB ? (
                <>
                  <Badge className={cn("border-0 text-[10px] font-semibold", badgeSettlement[selectedPB.settlementType])}>
                    {selectedPB.settlementType} PB
                  </Badge>
                  <span className={cn("text-sm font-semibold", textPrimary)}>{selectedPB.name}</span>
                  <span className={cn("text-xs", textMuted)}>
                    {selectedPB.effectiveDate} {selectedPB.endDate ? ` to ${selectedPB.endDate}` : ""}
                  </span>
                  <button onClick={() => { setSelectedPB(null); setActiveTab("pricebooks"); }}
                    className={cn("text-xs underline", isLight ? "text-blue-600" : "text-blue-400")}>
                    Change
                  </button>
                </>
              ) : (
                <span className={cn("text-sm", textMuted)}>
                  Select a price book from the Price Books tab
                  <button onClick={() => setActiveTab("pricebooks")}
                    className={cn("ml-2 underline", isLight ? "text-blue-600" : "text-blue-400")}>
                    Go to Price Books
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5", textMuted)} />
                <Input value={entrySearch} onChange={e => setEntrySearch(e.target.value)}
                  placeholder="Search entries..."
                  className={cn("h-8 w-48 pl-7 text-xs", inputBg)} />
              </div>
              <select value={entryTypeFilter} onChange={e => setEntryTypeFilter(e.target.value)}
                className={cn("h-8 text-xs rounded-md border px-2", inputBg)}>
                <option value="all">All Entry Types</option>
                {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {selectedPB && (
                <Button size="sm" className={cn("h-8 px-3 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
                  onClick={() => { setEditingEntryId(null); setEntryForm({ ...defaultEntryForm(), priceBookId: selectedPB.id }); setShowEntryModal(true); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" />Add Entry
                </Button>
              )}
            </div>
          </div>

          {/* Entry Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className={cn("text-[10px] uppercase tracking-wider", textMuted, borderColor, "border-b", bgSub)}>
                  <th className="px-3 py-2.5 text-left">Entry Type</th>
                  <th className="px-3 py-2.5 text-left">Accessorial</th>
                  <th className="px-3 py-2.5 text-left">Shipper</th>
                  <th className="px-3 py-2.5 text-left">Carrier Type</th>
                  <th className="px-3 py-2.5 text-left">Carrier</th>
                  <th className="px-3 py-2.5 text-left">Driver Grp</th>
                  <th className="px-3 py-2.5 text-left">Driver</th>
                  <th className="px-3 py-2.5 text-left">Truck Type</th>
                  <th className="px-3 py-2.5 text-left">Product Grp</th>
                  <th className="px-3 py-2.5 text-left">Origin</th>
                  <th className="px-3 py-2.5 text-left">Destination</th>
                  <th className="px-3 py-2.5 text-left">Rate Type</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                  <th className="px-3 py-2.5 text-left">UOM</th>
                  <th className="px-3 py-2.5 text-left">Effective</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedPB ? (
                  <tr><td colSpan={16} className={cn("px-3 py-16 text-center", textMuted)}>
                    <LayoutList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium mb-1">No price book selected</p>
                    <p className="text-[11px] opacity-60">Select a price book to view its rate entries</p>
                  </td></tr>
                ) : filteredEntries.length === 0 ? (
                  <tr><td colSpan={16} className={cn("px-3 py-16 text-center", textMuted)}>
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium mb-1">No entries in this price book</p>
                    <p className="text-[11px] opacity-60">Add rate entries to define your pricing rules</p>
                  </td></tr>
                ) : filteredEntries.map(entry => (
                  <tr key={entry.id} className={cn("transition-colors", borderColor, "border-b", hoverRow)}>
                    <td className={cn("px-3 py-2.5 font-medium", textPrimary)}>
                      <Badge className={cn("border-0 text-[10px]", isLight ? "bg-slate-100 text-slate-700" : "bg-white/[0.06] text-slate-300")}>
                        {entry.entryType}
                      </Badge>
                    </td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.accessorialType || "---"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.shipper || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.carrierType || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.carrier || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.driverGroup || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.driver || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.truckType || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.productGroup || "(ALL)"}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>
                      {entry.origin ? entry.origin : entry.originState ? entry.originState : entry.originRegion || "(ALL)"}
                    </td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>
                      {entry.destination ? entry.destination : entry.destinationState ? entry.destinationState : entry.destinationRegion || "(ALL)"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge className={cn("border-0 text-[10px]", isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/10 text-blue-400")}>
                        {RATE_TYPE_LABELS[entry.rateType] || entry.rateType}
                      </Badge>
                    </td>
                    <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", isLight ? "text-emerald-600" : "text-emerald-400")}>
                      ${entry.rate.toFixed(2)}
                    </td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.uom}</td>
                    <td className={cn("px-3 py-2.5", textSecondary)}>{entry.effectiveDate}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button className={cn("p-1 rounded", isLight ? "hover:bg-slate-100 text-slate-400 hover:text-slate-700" : "hover:bg-white/[0.06] text-slate-400 hover:text-white")}
                          onClick={() => {
                            setEditingEntryId(entry.id);
                            setEntryForm({ ...entry });
                            setShowEntryModal(true);
                          }} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className={cn("p-1 rounded", isLight ? "hover:bg-red-50 text-slate-400 hover:text-red-600" : "hover:bg-red-500/10 text-slate-400 hover:text-red-400")}
                          onClick={() => deleteEntry(entry.id)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={cn("flex items-center justify-between px-4 py-2 text-xs shrink-0", borderColor, "border-t", bgSub)}>
            <span className={textMuted}>
              {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"}
              {selectedPB ? ` in ${selectedPB.name}` : ""}
            </span>
            <div className="flex gap-4">
              {ENTRY_TYPES.slice(0, 5).map(et => {
                const count = filteredEntries.filter(e => e.entryType === et).length;
                if (!count) return null;
                return <span key={et} className={textMuted}><span className="text-amber-500 font-semibold">{count}</span> {et}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: SETTLEMENT ═══ */}
      {activeTab === "settlement" && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={cn("text-lg font-bold", textPrimary)}>Settlement Configuration</h2>
                <p className={cn("text-xs mt-1", textMuted)}>Map price book entries to settlement calculations for each tier</p>
              </div>
            </div>

            {SETTLEMENT_TYPES.map(type => {
              const typePBs = priceBooks.filter(p => p.settlementType === type);
              const typeEntries = pbEntries.filter(e => typePBs.some(p => p.id === e.priceBookId));
              const settlementEntries = typeEntries.filter(e =>
                e.entryType === "Settlement Rate" || e.entryType === "Min Settle Units"
              );

              return (
                <Card key={type} className={cn("p-5 rounded-xl border", bgCard)}>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={cn("border-0 text-xs font-semibold px-3 py-1", badgeSettlement[type])}>
                      {type} Settlement
                    </Badge>
                    <span className={cn("text-xs", textMuted)}>
                      {typePBs.length} price book{typePBs.length !== 1 ? "s" : ""} | {settlementEntries.length} settlement entr{settlementEntries.length !== 1 ? "ies" : "y"}
                    </span>
                  </div>

                  {typePBs.length === 0 ? (
                    <p className={cn("text-xs py-6 text-center", textMuted)}>No {type.toLowerCase()} price books configured</p>
                  ) : (
                    <div className="space-y-3">
                      {typePBs.map(pb => {
                        const pbSettleEntries = settlementEntries.filter(e => e.priceBookId === pb.id);
                        return (
                          <div key={pb.id} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-white/[0.02] border-white/[0.04]")}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn("text-xs font-semibold", textPrimary)}>{pb.name}</span>
                              <span className={cn("text-[10px]", textMuted)}>
                                {pb.effectiveDate} - {pb.endDate || "No end"}
                              </span>
                            </div>
                            {pbSettleEntries.length === 0 ? (
                              <p className={cn("text-[11px]", textMuted)}>No settlement entries - rates from this PB will use default settlement rules</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {pbSettleEntries.map(se => (
                                  <div key={se.id} className={cn("p-2 rounded border text-[11px]", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]")}>
                                    <div className={cn("font-medium", textPrimary)}>{se.entryType}</div>
                                    <div className={cn(textMuted)}>
                                      {RATE_TYPE_LABELS[se.rateType] || se.rateType}: ${se.rate.toFixed(2)} / {se.uom}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB: CONFIGURATION ═══ */}
      {activeTab === "configuration" && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className={cn("text-lg font-bold", textPrimary)}>Pricebook Configuration</h2>
              <p className={cn("text-xs mt-1", textMuted)}>Global settings for the 3-tier pricebook system</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className={cn("p-5 rounded-xl border", bgCard)}>
                <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", textPrimary)}>
                  <Settings className="w-4 h-4 text-amber-500" />
                  Rate Lookup Priority
                </h3>
                <div className="space-y-2">
                  {[
                    { priority: 1, label: "Terminal + Customer Specific", desc: "Exact terminal pair + specific customer" },
                    { priority: 2, label: "Terminal General", desc: "Exact terminal pair, any customer" },
                    { priority: 3, label: "City + Customer Specific", desc: "City pair + specific customer" },
                    { priority: 4, label: "City General", desc: "City pair, any customer" },
                    { priority: 5, label: "State + Customer Specific", desc: "State pair + specific customer" },
                    { priority: 6, label: "State General", desc: "State pair, any customer" },
                    { priority: 7, label: "Region", desc: "Region-based fallback" },
                  ].map(p => (
                    <div key={p.priority} className={cn("flex items-center gap-3 p-2.5 rounded-lg", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400"
                      )}>{p.priority}</span>
                      <div>
                        <div className={cn("text-xs font-medium", textPrimary)}>{p.label}</div>
                        <div className={cn("text-[10px]", textMuted)}>{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className={cn("p-5 rounded-xl border", bgCard)}>
                <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", textPrimary)}>
                  <ListChecks className="w-4 h-4 text-amber-500" />
                  Entry Types ({ENTRY_TYPES.length})
                </h3>
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {ENTRY_TYPES.map((t, i) => (
                    <div key={t} className={cn("flex items-center gap-2 px-2 py-1.5 rounded text-xs", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]")}>
                      <span className={cn("w-5 text-[10px] font-mono", textMuted)}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={textPrimary}>{t}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className={cn("p-5 rounded-xl border", bgCard)}>
              <h3 className={cn("text-sm font-semibold mb-4 flex items-center gap-2", textPrimary)}>
                <DollarSign className="w-4 h-4 text-amber-500" />
                Rate Types & Units of Measure
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className={cn("text-xs font-semibold mb-2 uppercase tracking-wider", textMuted)}>Rate Types</h4>
                  <div className="space-y-1.5">
                    {RATE_TYPES.map(r => (
                      <div key={r.value} className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded text-xs", isLight ? "bg-slate-50" : "bg-white/[0.02]")}>
                        <Badge className={cn("border-0 text-[10px]", isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/10 text-blue-400")}>{r.value}</Badge>
                        <span className={textPrimary}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className={cn("text-xs font-semibold mb-2 uppercase tracking-wider", textMuted)}>Units of Measure</h4>
                  <div className="space-y-1.5">
                    {UOM_OPTIONS.map(u => (
                      <div key={u} className={cn("px-2.5 py-1.5 rounded text-xs", isLight ? "bg-slate-50" : "bg-white/[0.02]", textPrimary)}>{u}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ TAB: TOOLS (Legacy + Import/Export) ═══ */}
      {activeTab === "tools" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tools Toolbar */}
          <div className={cn("flex items-center justify-between px-4 py-2.5 shrink-0", borderColor, "border-b")}>
            <div className="flex items-center gap-3">
              <h2 className={cn("text-sm font-semibold", textPrimary)}>Rate Management Tools</h2>
              <span className={cn("text-xs", textMuted)}>{entries.length} legacy entries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5", textMuted)} />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rates..."
                  className={cn("h-8 w-48 pl-7 text-xs", inputBg)} />
              </div>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs", textSecondary)} onClick={() => setActiveOnly(!activeOnly)}>
                {activeOnly ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                {activeOnly ? "Active" : "All"}
              </Button>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs", textMuted)} onClick={() => entriesQuery.refetch()}>
                <RefreshCw className={cn("w-3.5 h-3.5", entriesQuery.isFetching && "animate-spin")} />
              </Button>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs", isLight ? "text-blue-600" : "text-blue-400")} onClick={handleExport}>
                <Download className="w-3.5 h-3.5 mr-1" />Export
              </Button>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs", isLight ? "text-green-600" : "text-green-400")} onClick={() => setShowImport(!showImport)}>
                <Upload className="w-3.5 h-3.5 mr-1" />Import
              </Button>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs", isLight ? "text-purple-600" : "text-purple-400")} onClick={() => navigate("/bulk-upload?type=rates")}>
                <Upload className="w-3.5 h-3.5 mr-1" />Bulk Import
              </Button>
              <Button size="sm" className={cn("h-8 px-3 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
                onClick={() => syncLegacyEntry()}>
                <Plus className="w-3.5 h-3.5 mr-1" />Quick Add
              </Button>
            </div>
          </div>

          {/* CSV Import Panel */}
          {showImport && (
            <div className={cn("px-4 py-3 space-y-2", borderColor, "border-b", bgSub)}>
              <div className="flex items-center justify-between">
                <h3 className={cn("text-xs font-semibold", textPrimary)}>Import CSV</h3>
                <button onClick={() => setShowImport(false)}><X className={cn("w-4 h-4", textMuted)} /></button>
              </div>
              <textarea value={importCsv} onChange={e => setImportCsv(e.target.value)}
                placeholder="Paste CSV text here..."
                className={cn("w-full h-24 text-xs border rounded p-2 resize-none", inputBg)} />
              <Button size="sm" className={cn("h-7 text-xs", isLight ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700")}
                onClick={() => importMut.mutate({ csvText: importCsv })} disabled={!importCsv || importMut.isPending}>
                {importMut.isPending ? "Importing..." : "Import Rates"}
              </Button>
            </div>
          )}

          {/* Quick Add Panel */}
          <div className={cn("px-4 py-3 space-y-3", borderColor, "border-b", bgSub)}>
            <h3 className={cn("text-xs font-semibold", textPrimary)}>Quick Rate Entry (Legacy API)</h3>
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
                  <label className={cn("text-[10px] uppercase mb-1 block", textMuted)}>{f.label}</label>
                  <Input type={f.type} value={(legacyForm as any)[f.key] || ""}
                    onChange={e => setLegacyForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    className={cn("h-8 text-xs", inputBg)} />
                </div>
              ))}
            </div>
            <Button size="sm" className={cn("h-8 px-4 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
              onClick={syncLegacyEntry} disabled={createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Create Entry"}
            </Button>
          </div>

          {/* Legacy Rate Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className={cn("text-[10px] uppercase tracking-wider", textMuted, borderColor, "border-b", bgSub)}>
                  <th className="px-3 py-2.5 text-left">Entry Name</th>
                  <th className="px-3 py-2.5 text-left">Origin</th>
                  <th className="px-3 py-2.5 text-left">Destination</th>
                  <th className="px-3 py-2.5 text-left">Cargo</th>
                  <th className="px-3 py-2.5 text-left">Hazmat</th>
                  <th className="px-3 py-2.5 text-left">Rate Type</th>
                  <th className="px-3 py-2.5 text-right">Rate</th>
                  <th className="px-3 py-2.5 text-right">Min Charge</th>
                  <th className="px-3 py-2.5 text-left">Effective</th>
                  <th className="px-3 py-2.5 text-left">Expires</th>
                  <th className="px-3 py-2.5 text-left">FSC</th>
                  <th className="px-3 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entriesQuery.isLoading ? (
                  <tr><td colSpan={12} className={cn("px-3 py-12 text-center", textMuted)}>Loading...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={12} className={cn("px-3 py-12 text-center", textMuted)}>
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />No rate entries found
                  </td></tr>
                ) : entries.map((e: any) => (
                  <tr key={e.id} className={cn("transition-colors", borderColor, "border-b", hoverRow, !e.isActive && "opacity-50")}>
                    <td className={cn("px-3 py-2 font-medium", textPrimary)}>{e.entryName}</td>
                    <td className={cn("px-3 py-2", textSecondary)}>
                      {e.originCity ? `${e.originCity}, ${e.originState || ""}` : e.originTerminalId ? `Terminal #${e.originTerminalId}` : "---"}
                    </td>
                    <td className={cn("px-3 py-2", textSecondary)}>
                      {e.destinationCity ? `${e.destinationCity}, ${e.destinationState || ""}` : e.destinationTerminalId ? `Terminal #${e.destinationTerminalId}` : "---"}
                    </td>
                    <td className="px-3 py-2">
                      {e.cargoType ? <Badge className={cn("border-0 text-[10px]", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/10 text-amber-400")}>{e.cargoType}</Badge> : "---"}
                    </td>
                    <td className={cn("px-3 py-2", textMuted)}>{e.hazmatClass || "---"}</td>
                    <td className="px-3 py-2">
                      <Badge className={cn("border-0 text-[10px]", isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/10 text-blue-400")}>
                        {RATE_TYPE_LABELS[e.rateType] || e.rateType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {editingId === e.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input type="number" value={editRate} onChange={ev => setEditRate(ev.target.value)}
                            className={cn("h-6 w-20 text-xs text-right", inputBg)} autoFocus />
                          <button onClick={() => updateMut.mutate({ entryId: e.id, rate: Number(editRate) })} className="text-emerald-500 hover:text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={cn("font-semibold cursor-pointer hover:underline", isLight ? "text-emerald-600" : "text-emerald-400")}
                          onClick={() => { setEditingId(e.id); setEditRate(String(Number(e.rate))); }}>
                          ${Number(e.rate).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className={cn("px-3 py-2 text-right", textMuted)}>{e.minimumCharge ? `$${Number(e.minimumCharge).toFixed(2)}` : "---"}</td>
                    <td className={cn("px-3 py-2", textSecondary)}>{e.effectiveDate || "---"}</td>
                    <td className={cn("px-3 py-2", textSecondary)}>{e.expirationDate || "---"}</td>
                    <td className="px-3 py-2">
                      {e.fscIncluded
                        ? <Badge className={cn("border-0 text-[10px]", isLight ? "bg-green-100 text-green-700" : "bg-green-500/10 text-green-400")}>Yes</Badge>
                        : <span className={textMuted}>No</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setHistoryEntryId(historyEntryId === e.id ? null : e.id)}
                          className={cn("p-1 rounded", isLight ? "hover:bg-slate-100 text-slate-400 hover:text-slate-700" : "hover:bg-white/[0.06] text-slate-400 hover:text-white")}>
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {e.isActive && (
                          <button onClick={() => deactivateMut.mutate({ entryId: e.id })}
                            className={cn("p-1 rounded", isLight ? "hover:bg-red-50 text-slate-400 hover:text-red-600" : "hover:bg-red-500/10 text-slate-400 hover:text-red-400")}>
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={cn("flex items-center justify-between px-4 py-2 text-xs shrink-0", borderColor, "border-t", bgSub)}>
            <span className={textMuted}>
              {entries.length} rate{entries.length !== 1 ? "s" : ""} | {activeOnly ? "active only" : "all entries"}
            </span>
            <div className="flex gap-3">
              {Object.entries(entries.reduce((acc: Record<string, number>, e: any) => { acc[e.rateType] = (acc[e.rateType] || 0) + 1; return acc; }, {})).map(([type, count]) => (
                <span key={type} className={textMuted}><span className="text-amber-500 font-medium">{count as number}</span> {RATE_TYPE_LABELS[type] || type}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Price Book Create/Edit ═══ */}
      {showPBModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPBModal(false)}>
          <Card className={cn("rounded-xl border p-0 w-full max-w-2xl max-h-[80vh] overflow-y-auto", bgCard)} onClick={e => e.stopPropagation()}>
            <div className={cn("flex items-center justify-between px-6 py-4", borderColor, "border-b")}>
              <h3 className={cn("text-sm font-bold", textPrimary)}>
                {editingPBId ? "Edit Price Book" : "New Price Book"}
              </h3>
              <button onClick={() => setShowPBModal(false)}><X className={cn("w-4 h-4", textMuted)} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Name" value={pbForm.name}
                  onChange={v => setPbForm(p => ({ ...p, name: v }))} isLight={isLight} />
                <SelectField label="Settlement Type" value={pbForm.settlementType}
                  onChange={v => setPbForm(p => ({ ...p, settlementType: v }))}
                  options={SETTLEMENT_TYPES} isLight={isLight} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <TextField label="Effective Date" value={pbForm.effectiveDate} type="date"
                  onChange={v => setPbForm(p => ({ ...p, effectiveDate: v }))} isLight={isLight} />
                <TextField label="End Date" value={pbForm.endDate} type="date"
                  onChange={v => setPbForm(p => ({ ...p, endDate: v }))} isLight={isLight} />
                <TextField label="Locked Through" value={pbForm.lockedThrough} type="date"
                  onChange={v => setPbForm(p => ({ ...p, lockedThrough: v }))} isLight={isLight} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Shipper" value={pbForm.shipper}
                  onChange={v => setPbForm(p => ({ ...p, shipper: v }))} isLight={isLight} />
                <SelectField label="Carrier Type" value={pbForm.carrierType}
                  onChange={v => setPbForm(p => ({ ...p, carrierType: v }))}
                  options={CARRIER_TYPES} isLight={isLight} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <TextField label="Carrier" value={pbForm.carrier}
                  onChange={v => setPbForm(p => ({ ...p, carrier: v }))} isLight={isLight} />
                <TextField label="Driver Group" value={pbForm.driverGroup}
                  onChange={v => setPbForm(p => ({ ...p, driverGroup: v }))} isLight={isLight} />
                <TextField label="Driver" value={pbForm.driver}
                  onChange={v => setPbForm(p => ({ ...p, driver: v }))} isLight={isLight} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pbForm.isCurrent}
                    onChange={e => setPbForm(p => ({ ...p, isCurrent: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  <span className={cn("text-xs", textPrimary)}>Mark as Current</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pbForm.isLocked}
                    onChange={e => setPbForm(p => ({ ...p, isLocked: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  <span className={cn("text-xs", textPrimary)}>Locked</span>
                </label>
              </div>
            </div>
            <div className={cn("flex items-center justify-end gap-2 px-6 py-4", borderColor, "border-t")}>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowPBModal(false)}>Cancel</Button>
              <Button size="sm" className={cn("h-8 px-4 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
                onClick={savePB}>
                {editingPBId ? "Save Changes" : "Create Price Book"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ MODAL: Entry Create/Edit (The Big One) ═══ */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEntryModal(false)}>
          <Card className={cn("rounded-xl border p-0 w-full max-w-5xl max-h-[85vh] overflow-y-auto", bgCard)} onClick={e => e.stopPropagation()}>
            <div className={cn("flex items-center justify-between px-6 py-4", borderColor, "border-b")}>
              <div className="flex items-center gap-3">
                <h3 className={cn("text-sm font-bold", textPrimary)}>
                  {editingEntryId ? "Edit Rate Entry" : "New Rate Entry"}
                </h3>
                {selectedPB && (
                  <Badge className={cn("border-0 text-[10px] font-semibold", badgeSettlement[selectedPB.settlementType])}>
                    {selectedPB.name}
                  </Badge>
                )}
              </div>
              <button onClick={() => { setShowEntryModal(false); setEditingEntryId(null); }}>
                <X className={cn("w-4 h-4", textMuted)} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                {/* ─── Column 1: Who ─── */}
                <div className="space-y-3">
                  <h4 className={cn("text-[10px] uppercase font-bold tracking-widest pb-2 mb-1", textMuted, borderColor, "border-b")}>
                    Participants
                  </h4>
                  <SelectField label="Entry Type" value={entryForm.entryType}
                    onChange={v => setEntryForm(p => ({ ...p, entryType: v }))}
                    options={ENTRY_TYPES} isLight={isLight} />
                  <TextField label="Accessorial Type" value={entryForm.accessorialType}
                    onChange={v => setEntryForm(p => ({ ...p, accessorialType: v }))} isLight={isLight} />
                  <TextField label="Shipper" value={entryForm.shipper}
                    onChange={v => setEntryForm(p => ({ ...p, shipper: v }))} isLight={isLight} />
                  <SelectField label="Carrier Type" value={entryForm.carrierType}
                    onChange={v => setEntryForm(p => ({ ...p, carrierType: v }))}
                    options={CARRIER_TYPES} isLight={isLight} />
                  <TextField label="Carrier" value={entryForm.carrier}
                    onChange={v => setEntryForm(p => ({ ...p, carrier: v }))} isLight={isLight} />
                  <TextField label="Driver Group" value={entryForm.driverGroup}
                    onChange={v => setEntryForm(p => ({ ...p, driverGroup: v }))} isLight={isLight} />
                  <TextField label="Driver" value={entryForm.driver}
                    onChange={v => setEntryForm(p => ({ ...p, driver: v }))} isLight={isLight} />
                </div>

                {/* ─── Column 2: What & Where ─── */}
                <div className="space-y-3">
                  <h4 className={cn("text-[10px] uppercase font-bold tracking-widest pb-2 mb-1", textMuted, borderColor, "border-b")}>
                    Commodity & Location
                  </h4>
                  <SelectField label="Truck Type" value={entryForm.truckType}
                    onChange={v => setEntryForm(p => ({ ...p, truckType: v }))}
                    options={TRUCK_TYPES} isLight={isLight} />
                  <SelectField label="Product Group" value={entryForm.productGroup}
                    onChange={v => setEntryForm(p => ({ ...p, productGroup: v }))}
                    options={PRODUCT_GROUPS} isLight={isLight} />
                  <TextField label="Origin" value={entryForm.origin}
                    onChange={v => setEntryForm(p => ({ ...p, origin: v }))} isLight={isLight} />
                  <TextField label="Destination" value={entryForm.destination}
                    onChange={v => setEntryForm(p => ({ ...p, destination: v }))} isLight={isLight} />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Origin State" value={entryForm.originState}
                      onChange={v => setEntryForm(p => ({ ...p, originState: v }))}
                      options={US_STATES} isLight={isLight} />
                    <SelectField label="Dest State" value={entryForm.destinationState}
                      onChange={v => setEntryForm(p => ({ ...p, destinationState: v }))}
                      options={US_STATES} isLight={isLight} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Origin Region" value={entryForm.originRegion}
                      onChange={v => setEntryForm(p => ({ ...p, originRegion: v }))}
                      options={REGIONS} isLight={isLight} />
                    <SelectField label="Dest Region" value={entryForm.destinationRegion}
                      onChange={v => setEntryForm(p => ({ ...p, destinationRegion: v }))}
                      options={REGIONS} isLight={isLight} />
                  </div>
                  <TextField label="Producer" value={entryForm.producer}
                    onChange={v => setEntryForm(p => ({ ...p, producer: v }))} isLight={isLight} />
                </div>

                {/* ─── Column 3: Pricing ─── */}
                <div className="space-y-3">
                  <h4 className={cn("text-[10px] uppercase font-bold tracking-widest pb-2 mb-1", textMuted, borderColor, "border-b")}>
                    Pricing
                  </h4>
                  <SelectField label="Reason" value={entryForm.reason}
                    onChange={v => setEntryForm(p => ({ ...p, reason: v }))}
                    options={REASON_OPTIONS} isLight={isLight} />
                  <SelectField label="Rate Type" value={entryForm.rateType}
                    onChange={v => setEntryForm(p => ({ ...p, rateType: v }))}
                    options={["flat", "per_mile", "per_barrel", "per_ton", "per_gallon"]} isLight={isLight} />
                  <TextField label="Rate ($)" value={String(entryForm.rate)} type="number"
                    onChange={v => setEntryForm(p => ({ ...p, rate: Number(v) }))} isLight={isLight} />
                  <SelectField label="Unit of Measure" value={entryForm.uom}
                    onChange={v => setEntryForm(p => ({ ...p, uom: v }))}
                    options={UOM_OPTIONS} isLight={isLight} />

                  <div className={cn("rounded-lg p-3 space-y-3 mt-2", isLight ? "bg-slate-50 border border-slate-100" : "bg-white/[0.02] border border-white/[0.04]")}>
                    <h5 className={cn("text-[10px] uppercase font-bold tracking-widest", textMuted)}>Date Range</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField label="PB Start" value={entryForm.pbStart} type="date"
                        onChange={v => setEntryForm(p => ({ ...p, pbStart: v }))} isLight={isLight} />
                      <TextField label="PB End" value={entryForm.pbEnd} type="date"
                        onChange={v => setEntryForm(p => ({ ...p, pbEnd: v }))} isLight={isLight} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField label="Effective Date" value={entryForm.effectiveDate} type="date"
                        onChange={v => setEntryForm(p => ({ ...p, effectiveDate: v }))} isLight={isLight} />
                      <TextField label="End Date" value={entryForm.endDate} type="date"
                        onChange={v => setEntryForm(p => ({ ...p, endDate: v }))} isLight={isLight} />
                    </div>

                    {/* Effective date visual range */}
                    <div>
                      <label className={cn("text-[10px] uppercase font-semibold mb-2 block tracking-wider", textMuted)}>
                        Effective Period
                      </label>
                      <div className={cn("relative h-2 rounded-full", isLight ? "bg-slate-200" : "bg-white/[0.08]")}>
                        <div className="absolute h-full rounded-full bg-amber-500/60"
                          style={{
                            left: entryForm.pbStart && entryForm.effectiveDate
                              ? `${Math.max(0, Math.min(100, ((new Date(entryForm.effectiveDate).getTime() - new Date(entryForm.pbStart).getTime()) / (Math.max(1, (new Date(entryForm.pbEnd || entryForm.endDate || entryForm.effectiveDate).getTime() - new Date(entryForm.pbStart).getTime())))) * 100))}%`
                              : "0%",
                            right: entryForm.pbEnd && entryForm.endDate
                              ? `${Math.max(0, Math.min(100, ((new Date(entryForm.pbEnd).getTime() - new Date(entryForm.endDate).getTime()) / (Math.max(1, (new Date(entryForm.pbEnd).getTime() - new Date(entryForm.pbStart).getTime())))) * 100))}%`
                              : "0%",
                          }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className={cn("text-[9px]", textMuted)}>{entryForm.pbStart}</span>
                        <span className={cn("text-[9px]", textMuted)}>{entryForm.pbEnd || "No end"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("flex items-center justify-end gap-2 px-6 py-4", borderColor, "border-t")}>
              <Button variant="ghost" size="sm" className="h-8 text-xs"
                onClick={() => { setShowEntryModal(false); setEditingEntryId(null); }}>
                Cancel
              </Button>
              <Button size="sm" className={cn("h-8 px-6 text-xs", isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-600 hover:bg-amber-700")}
                onClick={saveEntry}>
                {editingEntryId ? "Save Entry" : "Add Entry"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══ MODAL: Rate History (Legacy) ═══ */}
      {historyEntryId && historyQuery.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setHistoryEntryId(null)}>
          <Card className={cn("rounded-xl border p-6 w-96 max-h-80 overflow-y-auto space-y-3", bgCard)} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-semibold flex items-center gap-2", textPrimary)}>
                <TrendingUp className="w-4 h-4 text-amber-500" />Rate History -- {historyQuery.data.entryName}
              </h3>
              <button onClick={() => setHistoryEntryId(null)}><X className={cn("w-4 h-4", textMuted)} /></button>
            </div>
            <div className={cn("text-xs", textMuted)}>
              Current rate: <span className={cn("font-semibold", isLight ? "text-emerald-600" : "text-emerald-400")}>${Number(historyQuery.data.currentRate).toFixed(2)}</span>
            </div>
            {historyQuery.data.history.length === 0 ? (
              <div className={cn("text-xs py-4 text-center", textMuted)}>No rate changes recorded</div>
            ) : (
              <div className="space-y-2">
                {historyQuery.data.history.map((h: any, i: number) => (
                  <div key={i} className={cn("flex items-center justify-between py-1.5 text-xs", borderColor, "border-b")}>
                    <span className={textMuted}>{new Date(h.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">${Number(h.previousRate).toFixed(2)}</span>
                      <span className={textMuted}>-&gt;</span>
                      <span className={cn(isLight ? "text-emerald-600" : "text-emerald-400")}>${Number(h.newRate).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
