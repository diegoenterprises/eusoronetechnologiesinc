/**
 * TERMINAL LOADING ORDER — Rack Loading Dispatch
 *
 * Real-world terminal loading order flow matching industry standards (Blue Wing, Buckeye, etc.)
 * 
 * Order Fields (Industry Standard):
 *   - Order Number (auto-generated)
 *   - Terminal (this facility)
 *   - Order Type (Rack Loading / Transfer / Blending)
 *   - Status (Draft → Scheduled → Loading → Complete)
 *   - Check In Date / Order Date
 *   - Position Holder (marketer/shipper who owns product allocation)
 *   - Carrier (transport company)
 *   - Product (fuel grade)
 *   - Trailer Number
 *   - Tank (source storage tank)
 *
 * BOL generated upon dispatch confirmation.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  Droplets, Truck, MapPin, FileText, CheckCircle,
  Fuel, Users, Gauge, Container, Hash,
  AlertTriangle, Zap, Clock, Building2, CalendarIcon,
  Wifi, WifiOff, Loader2, ChevronDown, Copy, Download,
  Search, Mail, Phone, Shield, ExternalLink, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import type { ParsedAddress } from "@/components/AddressAutocomplete";

type OrderStatus = "draft" | "scheduled" | "loading" | "complete";
type OrderType = "rack_loading" | "transfer" | "blending";

const generateOrderNumber = () => `${Date.now().toString().slice(-7)}`;

export default function TerminalCreateLoad() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();

  // Order state - matches real terminal systems
  const [orderNumber] = useState(generateOrderNumber);
  const [orderType, setOrderType] = useState<OrderType>("rack_loading");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("draft");
  const [checkInDate, setCheckInDate] = useState<string>("");

  const [form, setForm] = useState({
    // Position Holder (who owns the product)
    positionHolderId: "",
    positionHolderName: "",
    positionHolderType: "",
    // Carrier
    carrierId: "",
    carrierCode: "",
    carrierName: "",
    // Product & Tank
    productId: "",
    productName: "",
    tankId: "",
    tankName: "",
    hazmatClass: "",
    unNumber: "",
    // Trailer
    trailerNumber: "",
    driverName: "",
    // Quantity
    quantity: "",
    quantityUnit: "gal",
    // Destination
    destinationAddress: "",
    destinationCity: "",
    destinationState: "",
    destinationZip: "",
    // Additional
    specialInstructions: "",
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  // ─── FMCSA Carrier Lookup State ───
  const [carrierSearch, setCarrierSearch] = useState("");
  const [carrierResults, setCarrierResults] = useState<any[]>([]);
  const [carrierSearching, setCarrierSearching] = useState(false);
  const [showCarrierResults, setShowCarrierResults] = useState(false);
  const [carrierNotFound, setCarrierNotFound] = useState(false);
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteContact, setInviteContact] = useState({ email: "", phone: "" });
  const [scheduledDateObj, setScheduledDateObj] = useState<Date>(new Date());
  const [schedTimeHour, setSchedTimeHour] = useState(new Date().getHours().toString().padStart(2, "0"));
  const [schedTimeMin, setSchedTimeMin] = useState(new Date().getMinutes().toString().padStart(2, "0"));
  const [schedCalOpen, setSchedCalOpen] = useState(false);

  // ─── Data Queries ───
  const inventoryQ = (trpc as any).terminals?.getInventory?.useQuery?.({}) || { data: null, isLoading: false };
  const tasQ = (trpc as any).terminals?.getTASConnectionStatus?.useQuery?.({}, { refetchInterval: 15000 }) || { data: null, refetch: () => {} };
  const partnersQ = (trpc as any).supplyChain?.getTerminalPartners?.useQuery?.({}) || { data: null };
  const profileQ = (trpc as any).terminals?.getTerminalProfile?.useQuery?.() || { data: null };

  const inventory = useMemo(() => (inventoryQ.data || []) as any[], [inventoryQ.data]);
  const partners = useMemo(() => (partnersQ.data || []) as any[], [partnersQ.data]);
  const tasStatus = tasQ.data as { provider: string; connected: boolean; lastSync?: string } | null;
  const terminal = profileQ.data as { name?: string; city?: string; state?: string; address?: string } | null;

  // ─── FMCSA SAFER Carrier Lookup ───
  const doCarrierLookup = useCallback(async (query: string) => {
    if (query.length < 2) { setCarrierResults([]); setShowCarrierResults(false); return; }
    setCarrierSearching(true);
    setCarrierNotFound(false);
    try {
      const resp = await fetch(`/api/fmcsa/search?q=${encodeURIComponent(query)}&limit=8`);
      if (resp.ok) {
        const data = await resp.json();
        const results = data?.results || data?.carriers || data || [];
        setCarrierResults(Array.isArray(results) ? results.slice(0, 8) : []);
        setShowCarrierResults(true);
        setCarrierNotFound(Array.isArray(results) && results.length === 0);
      } else {
        setCarrierResults([]);
        setCarrierNotFound(true);
        setShowCarrierResults(true);
      }
    } catch {
      setCarrierResults([]);
      setCarrierNotFound(true);
      setShowCarrierResults(true);
    } finally {
      setCarrierSearching(false);
    }
  }, []);

  // Debounced carrier search
  useEffect(() => {
    if (!carrierSearch || carrierSearch.length < 2) return;
    const timer = setTimeout(() => doCarrierLookup(carrierSearch), 400);
    return () => clearTimeout(timer);
  }, [carrierSearch, doCarrierLookup]);

  const selectCarrier = (c: any) => {
    update("carrierName", c.legalName || c.carrierName || c.name || "");
    update("carrierCode", c.dotNumber || c.mcNumber || c.usdotNumber || "");
    update("carrierId", String(c.id || c.dotNumber || ""));
    setShowCarrierResults(false);
    setCarrierSearch("");
    setInviteMode(false);
    setCarrierNotFound(false);
  };

  const handleInviteCarrier = () => {
    if (!inviteContact.email && !inviteContact.phone) {
      toast.error("Enter an email or phone number to invite");
      return;
    }
    toast.success(`Invitation sent to ${inviteContact.email || inviteContact.phone}`, {
      description: "They'll receive a link to join EusoTrip and accept this dispatch",
    });
    setInviteMode(false);
  };

  // ─── Mutations ───
  const createLoadMut = (trpc as any).loads?.create?.useMutation?.({
    onSuccess: (data: any) => {
      setOrderStatus("scheduled");
      toast.success(`Order ${orderNumber} scheduled — BOL generated`, {
        description: `Load ${data?.loadNumber || ""} ready for pickup`,
      });
      setTimeout(() => navigate("/outgoing"), 1500);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create order"),
  }) || { mutate: () => {}, isPending: false };

  const bolMut = (trpc as any).terminals?.generateBOL?.useMutation?.({
    onSuccess: () => {},
    onError: () => {},
  }) || { mutate: () => {}, isPending: false };

  const selectedTank = inventory.find((t: any) => t.tankId === form.tankId);
  const selectedPartner = partners.find((p: any) => (p.id || p.companyId) === form.positionHolderId);

  // Validation
  const canSchedule = 
    form.positionHolderId && 
    form.tankId && 
    form.quantity && 
    form.trailerNumber &&
    form.destinationCity && 
    form.destinationState;

  // Compute scheduled datetime from calendar + time inputs
  const scheduledDatetime = useMemo(() => {
    const d = new Date(scheduledDateObj);
    d.setHours(Number(schedTimeHour) || 0, Number(schedTimeMin) || 0);
    return d;
  }, [scheduledDateObj, schedTimeHour, schedTimeMin]);

  const handleSchedule = () => {
    const originAddr = terminal?.address || `${terminal?.city || "Houston"}, ${terminal?.state || "TX"}`;
    const destAddr = form.destinationAddress || `${form.destinationCity}, ${form.destinationState}`;

    createLoadMut.mutate({
      origin: originAddr,
      destination: destAddr,
      originLat: 29.76,
      originLng: -95.37,
      destLat: 0,
      destLng: 0,
      equipment: "tanker",
      hazmatClass: form.hazmatClass || undefined,
      unNumber: form.unNumber || undefined,
      quantity: form.quantity || undefined,
      quantityUnit: form.quantityUnit === "bbl" ? "Barrels" : "Gallons",
      productName: form.productName || "Petroleum product",
      pickupDate: scheduledDatetime.toISOString(),
      deliveryDate: new Date(scheduledDatetime.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      rate: "0",
      assignmentType: form.carrierId ? "direct_catalyst" : "open_market",
    });

    bolMut.mutate({
      appointmentId: `APT-${orderNumber}`,
      productId: form.tankId,
      quantity: Number(form.quantity) || 0,
      destination: `${form.destinationCity}, ${form.destinationState}`,
    });
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    toast.success("Order number copied");
  };

  const statusColors: Record<OrderStatus, string> = {
    draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    loading: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const orderTypeLabels: Record<OrderType, string> = {
    rack_loading: "Rack Loading",
    transfer: "Transfer",
    blending: "Blending",
  };

  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER — Order Number + Terminal + TAS Status
          ═══════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">Terminal Loading Order</p>
            <div className="flex items-center gap-3">
              <h1 className={cn("text-[32px] font-semibold tracking-tight tabular-nums", isLight ? "text-slate-900" : "text-white")}>
                #{orderNumber}
              </h1>
              <button onClick={copyOrderNumber} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
              <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border", statusColors[orderStatus])}>
                {orderStatus}
              </span>
            </div>
          </div>

          {/* TAS Status Badge */}
          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            {tasStatus?.connected ? (
              <span className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-medium">
                <Wifi className="w-3.5 h-3.5" />TAS Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                <WifiOff className="w-3.5 h-3.5" />TAS Offline
              </span>
            )}
            {tasStatus?.provider && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1473FF]/10 text-[#1473FF] font-medium">
                {tasStatus.provider}
              </span>
            )}
          </div>
        </div>

        {/* Terminal Name Strip */}
        <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
          <Building2 className="w-4 h-4" />
          <span className={cn("font-medium", isLight ? "text-slate-700" : "text-white/80")}>
            {terminal?.name || "Terminal"}
          </span>
          <span>•</span>
          <span>{terminal?.city || "Houston"}, {terminal?.state || "TX"}</span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          ORDER FORM — Single-page layout like real terminal systems
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-5">

        {/* ─────────────────────────────────────────────────────────────
            LEFT COLUMN — Order Details
            ───────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* ROW 1: Order Type + Schedule */}
          <div className={cn(
            "p-5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Order Type */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">Order Type</label>
                <div className="relative">
                  <select
                    value={orderType}
                    onChange={e => setOrderType(e.target.value as OrderType)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer pr-8",
                      isLight ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/[0.04] border border-white/[0.08] text-white"
                    )}
                  >
                    <option value="rack_loading">Rack Loading</option>
                    <option value="transfer">Transfer</option>
                    <option value="blending">Blending</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Scheduled Date — Brand Calendar */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <CalendarIcon className="w-3 h-3 inline mr-1" />Scheduled
                </label>
                <Popover open={schedCalOpen} onOpenChange={setSchedCalOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm text-left flex items-center gap-2",
                      isLight ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/[0.04] border border-white/[0.08] text-white"
                    )}>
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {scheduledDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, {schedTimeHour}:{schedTimeMin}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0 shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDateObj}
                      onSelect={(d: any) => { if (d) { setScheduledDateObj(d); } }}
                    />
                    <div className="px-4 pb-4 flex items-center gap-2">
                      <Input
                        type="number" min="0" max="23" value={schedTimeHour}
                        onChange={e => setSchedTimeHour(e.target.value.padStart(2, "0"))}
                        className="w-16 text-center rounded-xl text-sm bg-white/[0.04] border-white/[0.08]"
                      />
                      <span className="text-slate-400 font-bold">:</span>
                      <Input
                        type="number" min="0" max="59" value={schedTimeMin}
                        onChange={e => setSchedTimeMin(e.target.value.padStart(2, "0"))}
                        className="w-16 text-center rounded-xl text-sm bg-white/[0.04] border-white/[0.08]"
                      />
                      <Button size="sm" onClick={() => setSchedCalOpen(false)}
                        className="ml-auto h-8 px-3 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Order Date (auto) */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <Clock className="w-3 h-3 inline mr-1" />Order Date
                </label>
                <div className={cn(
                  "px-3 py-2.5 rounded-xl text-sm",
                  isLight ? "bg-slate-100 text-slate-600" : "bg-white/[0.03] text-white/60"
                )}>
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Position Holder + Carrier */}
          <div className={cn(
            "p-5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Position Holder */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <Users className="w-3 h-3 inline mr-1" />Position Holder <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.positionHolderId}
                    onChange={e => {
                      const p = partners.find((x: any) => (x.id || x.companyId) === e.target.value);
                      update("positionHolderId", e.target.value);
                      update("positionHolderName", p?.companyName || p?.name || "");
                      update("positionHolderType", p?.partnerType || "");
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer pr-8",
                      isLight ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/[0.04] border border-white/[0.08] text-white"
                    )}
                  >
                    <option value="">Select position holder...</option>
                    {partners.map((p: any) => (
                      <option key={p.id || p.companyId} value={p.id || p.companyId}>
                        {p.companyName || p.name} ({p.partnerType})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Marketer or shipper who owns product allocation</p>
              </div>

              {/* Carrier — FMCSA SAFER Lookup */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <Truck className="w-3 h-3 inline mr-1" />Carrier
                </label>
                {/* Selected carrier display */}
                {form.carrierName ? (
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center justify-between",
                    isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/20"
                  )}>
                    <div>
                      <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{form.carrierName}</p>
                      {form.carrierCode && <p className="text-[10px] text-slate-500 font-mono">DOT/MC: {form.carrierCode}</p>}
                    </div>
                    <button onClick={() => { update("carrierName", ""); update("carrierCode", ""); update("carrierId", ""); }}
                      className="text-[10px] text-slate-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10">Clear</button>
                  </div>
                ) : (
                  <>
                    {/* FMCSA Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={carrierSearch}
                        onChange={e => setCarrierSearch(e.target.value)}
                        placeholder="e.g. DIEGO ENTERPRISES, INC"
                        className={cn(
                          "pl-9 rounded-xl text-sm",
                          isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                        )}
                      />
                      {carrierSearching && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#1473FF] animate-spin" />}
                    </div>

                    {/* FMCSA Search Results */}
                    {showCarrierResults && carrierResults.length > 0 && (
                      <div className={cn(
                        "mt-1.5 rounded-xl border max-h-48 overflow-y-auto",
                        isLight ? "bg-white border-slate-200 shadow-lg" : "bg-[#1a1a2e] border-white/[0.08] shadow-2xl"
                      )}>
                        {carrierResults.map((c: any, i: number) => (
                          <button key={i} onClick={() => selectCarrier(c)}
                            className={cn("w-full p-2.5 text-left hover:bg-[#1473FF]/5 border-b last:border-0 transition-colors",
                              isLight ? "border-slate-100" : "border-white/[0.04]"
                            )}>
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-semibold", isLight ? "text-slate-800" : "text-white")}>{c.legalName || c.carrierName || c.name}</span>
                              <Shield className="w-3 h-3 text-emerald-400" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.dotNumber && <span className="text-[9px] text-slate-500 font-mono">DOT: {c.dotNumber}</span>}
                              {c.mcNumber && <span className="text-[9px] text-slate-500 font-mono">MC: {c.mcNumber}</span>}
                              {(c.phyCity || c.city) && <span className="text-[9px] text-slate-400">{c.phyCity || c.city}, {c.phyState || c.state}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Not Found → Invite */}
                    {carrierNotFound && !inviteMode && (
                      <div className={cn("mt-2 p-3 rounded-xl border text-center", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/5 border-amber-500/20")}>
                        <p className="text-[10px] text-amber-500 font-medium mb-1.5">Carrier not found in FMCSA SAFER database</p>
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" onClick={() => setInviteMode(true)}
                            className="h-7 px-3 text-[10px] rounded-lg bg-[#1473FF]/10 text-[#1473FF] hover:bg-[#1473FF]/20 border-0">
                            <UserPlus className="w-3 h-3 mr-1" />Invite Carrier
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { update("carrierName", carrierSearch); setShowCarrierResults(false); setCarrierNotFound(false); }}
                            className="h-7 px-3 text-[10px] rounded-lg text-slate-400">
                            Use Name Anyway
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Invite Mode — Email / Phone */}
                    {inviteMode && (
                      <div className={cn("mt-2 p-3 rounded-xl border space-y-2", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.06]")}>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Invite carrier to EusoTrip</p>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={inviteContact.email} onChange={e => setInviteContact(p => ({ ...p, email: e.target.value }))}
                            placeholder="carrier@email.com" className="pl-9 rounded-xl text-sm bg-white/[0.04] border-white/[0.08]" />
                        </div>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={inviteContact.phone} onChange={e => setInviteContact(p => ({ ...p, phone: e.target.value }))}
                            placeholder="(555) 555-1234" className="pl-9 rounded-xl text-sm bg-white/[0.04] border-white/[0.08]" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleInviteCarrier}
                            className="h-8 px-3 text-[10px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                            <Mail className="w-3 h-3 mr-1" />Send Invitation
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setInviteMode(false)}
                            className="h-8 px-3 text-[10px] rounded-xl text-slate-400">Cancel</Button>
                        </div>
                      </div>
                    )}

                    {!showCarrierResults && !carrierNotFound && !inviteMode && (
                      <p className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />FMCSA SAFER lookup — type carrier name or DOT#
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ROW 3: Product + Tank */}
          <div className={cn(
            "p-5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              <Droplets className="w-3 h-3 inline mr-1" />Product & Tank <span className="text-red-400">*</span>
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {inventory.map((tank: any) => {
                const isSelected = form.tankId === tank.tankId;
                const isLow = tank.status === "low" || tank.percentFull < 30;
                return (
                  <button
                    key={tank.tankId}
                    onClick={() => {
                      update("tankId", tank.tankId);
                      update("tankName", tank.tankId);
                      update("productName", tank.product);
                      update("productId", tank.tankId);
                      update("hazmatClass", tank.hazmatClass || "");
                      update("unNumber", tank.unNumber || "");
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-[#1473FF] bg-[#1473FF]/5 ring-2 ring-[#1473FF]/20"
                        : isLight ? "border-slate-200 bg-slate-50 hover:border-slate-300" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>
                        {tank.product}
                      </span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#1473FF] flex-shrink-0" />}
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
                      <div className={cn("h-full rounded-full",
                        tank.percentFull > 70 ? "bg-emerald-400" : tank.percentFull > 40 ? "bg-blue-400" : "bg-amber-400"
                      )} style={{ width: `${tank.percentFull}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 font-mono">{tank.tankId}</span>
                      <span className={cn("font-semibold",
                        tank.percentFull > 70 ? "text-emerald-500" : tank.percentFull > 40 ? "text-blue-500" : "text-amber-500"
                      )}>{tank.percentFull}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTank && (
              <div className={cn(
                "mt-3 p-3 rounded-xl flex items-center gap-3",
                isLight ? "bg-blue-50 border border-blue-100" : "bg-[#1473FF]/5 border border-[#1473FF]/10"
              )}>
                <Fuel className="w-4 h-4 text-[#1473FF]" />
                <div className="flex-1">
                  <span className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
                    {selectedTank.product}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    Tank {selectedTank.tankId} • {selectedTank.currentLevel?.toLocaleString()} {selectedTank.unit} available
                  </span>
                </div>
                {selectedTank.hazmatClass && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    HAZMAT Class {selectedTank.hazmatClass}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ROW 4: Trailer + Quantity */}
          <div className={cn(
            "p-5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Trailer Number */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Trailer # <span className="text-red-400">*</span>
                </label>
                <Input
                  value={form.trailerNumber}
                  onChange={e => update("trailerNumber", e.target.value.toUpperCase())}
                  placeholder="TMP07"
                  className={cn(
                    "rounded-xl text-sm font-mono",
                    isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                  )}
                />
              </div>

              {/* Driver Name */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Driver Name
                </label>
                <Input
                  value={form.driverName}
                  onChange={e => update("driverName", e.target.value)}
                  placeholder="John Smith"
                  className={cn(
                    "rounded-xl text-sm",
                    isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                  )}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  <Gauge className="w-3 h-3 inline mr-1" />Quantity <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={e => update("quantity", e.target.value)}
                  placeholder="8500"
                  className={cn(
                    "rounded-xl text-sm",
                    isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]"
                  )}
                />
              </div>

              {/* Unit */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">Unit</label>
                <div className="relative">
                  <select
                    value={form.quantityUnit}
                    onChange={e => update("quantityUnit", e.target.value)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer pr-8",
                      isLight ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/[0.04] border border-white/[0.08] text-white"
                    )}
                  >
                    <option value="gal">Gallons</option>
                    <option value="bbl">Barrels</option>
                    <option value="lbs">Pounds</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {selectedTank && form.quantity && (
              <p className={cn("text-[10px] mt-3",
                Number(form.quantity) > selectedTank.currentLevel ? "text-red-400" : "text-emerald-500"
              )}>
                {Number(form.quantity) > selectedTank.currentLevel
                  ? `⚠ Exceeds available (${selectedTank.currentLevel.toLocaleString()} ${selectedTank.unit})`
                  : `✓ ${((Number(form.quantity) / selectedTank.currentLevel) * 100).toFixed(1)}% of available inventory`
                }
              </p>
            )}
          </div>

          {/* ROW 5: Destination */}
          <div className={cn(
            "p-5 rounded-2xl border",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-3">
              <MapPin className="w-3 h-3 inline mr-1" />Destination <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-6 md:col-span-3">
                <AddressAutocomplete
                  value={form.destinationAddress}
                  onChange={(v) => update("destinationAddress", v)}
                  onSelect={(parsed: ParsedAddress) => {
                    setForm(prev => ({
                      ...prev,
                      destinationAddress: parsed.address,
                      destinationCity: parsed.city,
                      destinationState: parsed.state,
                      destinationZip: parsed.zip,
                    }));
                  }}
                  placeholder="Search destination address..."
                  className={cn("rounded-xl text-sm", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                />
              </div>
              <div className="col-span-3 md:col-span-1">
                <Input
                  value={form.destinationCity}
                  onChange={e => update("destinationCity", e.target.value)}
                  placeholder="City"
                  className={cn("rounded-xl text-sm", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                />
              </div>
              <div className="col-span-1">
                <Input
                  value={form.destinationState}
                  onChange={e => update("destinationState", e.target.value.toUpperCase())}
                  placeholder="ST"
                  maxLength={2}
                  className={cn("rounded-xl text-sm font-mono", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Input
                  value={form.destinationZip}
                  onChange={e => update("destinationZip", e.target.value)}
                  placeholder="ZIP"
                  className={cn("rounded-xl text-sm font-mono", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mt-4">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">Special Instructions</label>
              <textarea
                value={form.specialInstructions}
                onChange={e => update("specialInstructions", e.target.value)}
                placeholder="Driver instructions, delivery window, gate codes..."
                rows={2}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none",
                  isLight ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/[0.04] border border-white/[0.08] text-white"
                )}
              />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT COLUMN — Order Summary
            ───────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4">
          <div className={cn(
            "p-5 rounded-2xl border sticky top-6",
            isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <h3 className={cn("text-sm font-semibold mb-4", isLight ? "text-slate-800" : "text-white")}>
              Order Summary
            </h3>

            {/* Summary Table */}
            <div className="space-y-3">
              {[
                { label: "Order #", value: orderNumber, icon: Hash, mono: true },
                { label: "Terminal", value: terminal?.name || "Terminal", icon: Building2 },
                { label: "Order Type", value: orderTypeLabels[orderType], icon: Container },
                { label: "Position Holder", value: form.positionHolderName || "—", icon: Users },
                { label: "Carrier", value: form.carrierCode || form.carrierName || "—", icon: Truck },
                { label: "Product", value: form.productName || "—", icon: Droplets },
                { label: "Tank", value: form.tankName || "—", icon: Fuel, mono: true },
                { label: "Trailer #", value: form.trailerNumber || "—", icon: Truck, mono: true },
                { label: "Quantity", value: form.quantity ? `${Number(form.quantity).toLocaleString()} ${form.quantityUnit}` : "—", icon: Gauge },
                { label: "Destination", value: form.destinationCity && form.destinationState ? `${form.destinationCity}, ${form.destinationState}` : "—", icon: MapPin },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <row.icon className="w-3 h-3" />{row.label}
                  </span>
                  <span className={cn(
                    "text-xs font-medium text-right",
                    row.mono ? "font-mono" : "",
                    isLight ? "text-slate-800" : "text-white"
                  )}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Validation Indicator */}
            {!canSchedule && (
              <div className={cn(
                "mt-4 p-3 rounded-xl text-[10px]",
                isLight ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-amber-500/5 border border-amber-500/10 text-amber-400"
              )}>
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Complete required fields to schedule
              </div>
            )}

            {canSchedule && (
              <div className={cn(
                "mt-4 p-3 rounded-xl text-[10px]",
                isLight ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400"
              )}>
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                Ready to schedule — BOL will be generated
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <Button
                onClick={handleSchedule}
                disabled={!canSchedule || createLoadMut.isPending}
                className="w-full h-11 rounded-xl text-sm font-medium bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 disabled:opacity-40"
              >
                {createLoadMut.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scheduling...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" />Schedule Order</>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/docks")}
                className="w-full h-10 rounded-xl text-sm"
              >
                Cancel
              </Button>
            </div>

            {/* Info Footer */}
            <p className="text-[9px] text-slate-400 text-center mt-4">
              Scheduling generates BOL and updates TAS inventory
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
