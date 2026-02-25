/**
 * TERMINAL PARTNERS — Supply Chain Management
 * 
 * Terminal Manager view of all shippers, marketers, brokers, and transporters
 * linked to their terminal(s). Models the oil trucking supply chain:
 *   Terminal (rack/refinery) -> Shipper/Marketer -> Catalyst/Broker -> Driver
 * 
 * Theme-aware | Jony Ive design | Platform standard
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Building2, Users, TrendingUp, Package, Search,
  ArrowRight, Shield, Truck, BarChart3, Filter,
  Plus, ChevronDown, MapPin, Activity, Droplets,
  CheckCircle, Clock, AlertTriangle, XCircle,
  Send, Mail, Phone, BadgeCheck, UserPlus, Loader2
} from "lucide-react";

type PartnerFilter = "all" | "shipper" | "marketer" | "broker" | "transporter";

export default function TerminalPartners() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<PartnerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Partner form state
  const [apCompanySearch, setApCompanySearch] = useState("");
  const [apShowCompanySuggestions, setApShowCompanySuggestions] = useState(false);
  const [apSelectedCompany, setApSelectedCompany] = useState<any>(null);
  const [apPartnerType, setApPartnerType] = useState<"shipper" | "marketer" | "broker" | "transporter">("shipper");
  const [apRackAccess, setApRackAccess] = useState<"full" | "limited" | "scheduled">("scheduled");
  const [apVolume, setApVolume] = useState("");
  const [apProducts, setApProducts] = useState("");
  const [apNotes, setApNotes] = useState("");
  const companySuggestRef = useRef<HTMLDivElement>(null);

  // Invite state for non-platform companies
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<"sms" | "email">("email");
  const [inviteContact, setInviteContact] = useState("");

  const companySearchQ = (trpc as any).supplyChain?.searchCompanies?.useQuery?.(
    { query: apCompanySearch },
    { enabled: apCompanySearch.length >= 2, staleTime: 15000 }
  ) || { data: null, isLoading: false };

  // Get user's terminals for the terminalId
  const myTerminalsQ = (trpc as any).supplyChain?.getMyTerminals?.useQuery?.(undefined, { staleTime: 60000 }) || { data: null };
  const firstTerminalId = (myTerminalsQ.data as any[])?.[0]?.id || 0;

  const addPartnerMut = (trpc as any).supplyChain?.addPartner?.useMutation?.({
    onSuccess: () => {
      toast.success("Partner added", { description: `${apSelectedCompany?.name || "Company"} linked as ${apPartnerType}` });
      setShowAddModal(false);
      resetAddForm();
      partnersQuery.refetch?.();
      statsQuery.refetch?.();
    },
    onError: (err: any) => toast.error("Failed to add partner", { description: err?.message || "Unknown error" }),
  }) || { mutate: () => toast.error("Supply chain not available"), isPending: false };

  const invitePartnerMut = (trpc as any).supplyChain?.invitePartner?.useMutation?.({
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success("Invite sent!", { description: `Invitation sent via ${res.method}` });
        setShowInviteForm(false);
        setInviteContact("");
        setApSelectedCompany(null);
      } else {
        toast.error("Failed to send invite", { description: res?.error || "Unknown error" });
      }
    },
    onError: (err: any) => toast.error("Invite failed", { description: err?.message || "Unknown error" }),
  }) || { mutate: () => toast.error("Invite not available"), isPending: false };

  const resetAddForm = useCallback(() => {
    setApCompanySearch(""); setApSelectedCompany(null); setApPartnerType("shipper");
    setApRackAccess("scheduled"); setApVolume(""); setApProducts(""); setApNotes("");
    setShowInviteForm(false); setInviteContact("");
  }, []);

  const handleAddPartner = useCallback(() => {
    if (!apSelectedCompany) { toast.error("Select a company first"); return; }
    if (!firstTerminalId) { toast.error("No terminal found for your account"); return; }
    addPartnerMut.mutate({
      terminalId: firstTerminalId,
      companyId: apSelectedCompany.id,
      partnerType: apPartnerType,
      rackAccessLevel: apRackAccess,
      monthlyVolumeCommitment: apVolume ? parseInt(apVolume) : undefined,
      productTypes: apProducts ? apProducts.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
      notes: apNotes || undefined,
    });
  }, [apSelectedCompany, firstTerminalId, apPartnerType, apRackAccess, apVolume, apProducts, apNotes]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (companySuggestRef.current && !companySuggestRef.current.contains(e.target as Node)) setApShowCompanySuggestions(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const partnersQuery = (trpc as any).supplyChain?.getTerminalPartners?.useQuery?.(
    filter !== "all" ? { partnerType: filter } : {},
    { staleTime: 30_000 }
  ) || { data: null, isLoading: false };

  const statsQuery = (trpc as any).supplyChain?.getPartnerStats?.useQuery?.(
    undefined,
    { staleTime: 30_000 }
  ) || { data: null, isLoading: false };

  const flowQuery = (trpc as any).supplyChain?.getTerminalFlowSummary?.useQuery?.(
    undefined,
    { staleTime: 30_000 }
  ) || { data: null, isLoading: false };

  const partners = (partnersQuery.data || []) as any[];
  const stats = statsQuery.data as any;
  const flow = flowQuery.data as any;

  const filteredPartners = searchQuery
    ? partners.filter((p: any) =>
        p.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyDot?.includes(searchQuery) ||
        p.companyMc?.includes(searchQuery)
      )
    : partners;

  const cardCls = cn("rounded-2xl border transition-all", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const subtextCls = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const getStatusBadge = (status: string) => {
    const m: Record<string, { cls: string; icon: any; label: string }> = {
      active: { cls: isLight ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle, label: "Active" },
      pending: { cls: isLight ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock, label: "Pending" },
      suspended: { cls: isLight ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle, label: "Suspended" },
      terminated: { cls: isLight ? "bg-red-100 text-red-700 border-red-200" : "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Terminated" },
    };
    const s = m[status] || m.pending;
    const Icon = s.icon;
    return (
      <Badge className={cn("border text-[10px] font-semibold px-2 py-0.5 gap-1", s.cls)}>
        <Icon className="w-3 h-3" />{s.label}
      </Badge>
    );
  };

  const getPartnerTypeBadge = (type: string, isMarketerCompany?: boolean) => {
    const label = isMarketerCompany && type === "shipper" ? "Shipper / Marketer" : type.charAt(0).toUpperCase() + type.slice(1);
    const cls =
      type === "marketer" || isMarketerCompany
        ? (isLight ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-purple-500/20 text-purple-400 border-purple-500/30")
        : type === "shipper"
        ? (isLight ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-blue-500/20 text-blue-400 border-blue-500/30")
        : type === "broker"
        ? (isLight ? "bg-cyan-100 text-cyan-700 border-cyan-200" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30")
        : (isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-500/20 text-slate-400 border-slate-500/30");
    return <Badge className={cn("border text-[10px] font-semibold px-2 py-0.5", cls)}>{label}</Badge>;
  };

  const getRackBadge = (level: string) => {
    const cls =
      level === "full" ? (isLight ? "bg-emerald-50 text-emerald-600" : "text-green-400")
      : level === "limited" ? (isLight ? "bg-amber-50 text-amber-600" : "text-yellow-400")
      : (isLight ? "bg-slate-50 text-slate-500" : "text-slate-400");
    return <span className={cn("text-[10px] font-medium", cls)}>{level.toUpperCase()} access</span>;
  };

  const statCards = [
    { label: "Total Partners", value: stats?.total || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/15" },
    { label: "Active", value: stats?.active || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/15" },
    { label: "Shippers", value: stats?.shippers || 0, icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/15" },
    { label: "Marketers", value: stats?.marketers || 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/15" },
    { label: "Brokers", value: stats?.brokers || 0, icon: Building2, color: "text-cyan-500", bg: "bg-cyan-500/15" },
    { label: "Transporters", value: stats?.transporters || 0, icon: Truck, color: "text-orange-500", bg: "bg-orange-500/15" },
  ];

  const filterTabs: { key: PartnerFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "shipper", label: "Shippers" },
    { key: "marketer", label: "Marketers" },
    { key: "broker", label: "Brokers" },
    { key: "transporter", label: "Transporters" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Supply Chain Partners
          </h1>
          <p className={subtextCls}>Shippers, marketers, brokers & transporters linked to your terminal</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" />Add Partner
        </Button>
      </div>

      {/* Supply Chain Flow Banner */}
      <Card className={cn(cardCls, "overflow-hidden")}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>Supply Chain Flow</span>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { icon: Building2, label: "Terminal", sub: "Rack / Refinery", active: true },
              { icon: ArrowRight, label: "", sub: "", arrow: true },
              { icon: Package, label: "Shipper / Marketer", sub: `${flow?.activePartners || 0} partners`, active: true },
              { icon: ArrowRight, label: "", sub: "", arrow: true },
              { icon: Shield, label: "Catalyst / Broker", sub: "Arranges transport", active: true },
              { icon: ArrowRight, label: "", sub: "", arrow: true },
              { icon: Truck, label: "Driver", sub: "Delivers product", active: true },
            ].map((step, i) =>
              step.arrow ? (
                <ArrowRight key={i} className={cn("w-5 h-5 shrink-0", isLight ? "text-slate-300" : "text-slate-600")} />
              ) : (
                <div key={i} className={cn("flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[120px]", cellCls)}>
                  <step.icon className={cn("w-5 h-5", step.active ? "text-purple-500" : (isLight ? "text-slate-400" : "text-slate-500"))} />
                  <span className={cn("text-xs font-semibold", isLight ? "text-slate-700" : "text-white")}>{step.label}</span>
                  <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{step.sub}</span>
                </div>
              )
            )}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-dashed" style={{ borderColor: isLight ? "#e2e8f0" : "#334155" }}>
            <div className="text-center">
              <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{flow?.inbound || 0}</p>
              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Inbound Loads</p>
            </div>
            <div className="text-center">
              <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{flow?.outbound || 0}</p>
              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Outbound Loads</p>
            </div>
            <div className="text-center">
              <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{flow?.activePartners || 0}</p>
              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Active Partners</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div>
                  {statsQuery.isLoading ? (
                    <Skeleton className={cn("h-6 w-10 rounded-lg", isLight ? "bg-slate-100" : "")} />
                  ) : (
                    <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                  )}
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={cn("flex items-center gap-1 p-1 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === tab.key
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm"
                  : (isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 max-w-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
          <Search className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, DOT, or MC..."
            className={cn("bg-transparent text-sm outline-none w-full", isLight ? "text-slate-800 placeholder:text-slate-400" : "text-white placeholder:text-slate-500")}
          />
        </div>
      </div>

      {/* Partners List */}
      <div className="space-y-3">
        {partnersQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className={cardCls}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className={cn("w-12 h-12 rounded-xl", isLight ? "bg-slate-100" : "")} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className={cn("h-5 w-48 rounded-lg", isLight ? "bg-slate-100" : "")} />
                    <Skeleton className={cn("h-3 w-32 rounded-lg", isLight ? "bg-slate-100" : "")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPartners.length === 0 ? (
          <Card className={cardCls}>
            <CardContent className="p-10 text-center">
              <Users className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
              <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                {searchQuery ? "No partners match your search" : "No partners linked to your terminal yet"}
              </p>
              <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                Add shippers, marketers, or brokers to start tracking supply chain flow
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPartners.map((partner: any) => (
            <Card key={partner.id} className={cn(cardCls, "hover:shadow-md transition-shadow")}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl shrink-0", partner.isMarketer ? "bg-purple-500/15" : "bg-blue-500/15")}>
                    {partner.isMarketer ? (
                      <Droplets className="w-5 h-5 text-purple-500" />
                    ) : partner.partnerType === "broker" ? (
                      <Building2 className="w-5 h-5 text-cyan-500" />
                    ) : partner.partnerType === "transporter" ? (
                      <Truck className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Package className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>{partner.companyName || "Unknown Company"}</h3>
                      {getPartnerTypeBadge(partner.partnerType, partner.isMarketer)}
                      {getStatusBadge(partner.status)}
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {partner.companyDot && (
                        <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          DOT: <span className="font-medium">{partner.companyDot}</span>
                        </span>
                      )}
                      {partner.companyMc && (
                        <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          MC: <span className="font-medium">{partner.companyMc}</span>
                        </span>
                      )}
                      {(partner.companyCity || partner.companyState) && (
                        <span className={cn("text-xs flex items-center gap-1", isLight ? "text-slate-500" : "text-slate-400")}>
                          <MapPin className="w-3 h-3" />
                          {[partner.companyCity, partner.companyState].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {partner.rackAccessLevel && getRackBadge(partner.rackAccessLevel)}
                      {partner.monthlyVolumeCommitment > 0 && (
                        <span className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>
                          <BarChart3 className="w-3 h-3 inline mr-1" />
                          {Number(partner.monthlyVolumeCommitment).toLocaleString()} bbl/mo commitment
                        </span>
                      )}
                      {partner.productTypes?.length > 0 && (
                        <span className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>
                          <Droplets className="w-3 h-3 inline mr-1" />
                          {partner.productTypes.join(", ")}
                        </span>
                      )}
                      {partner.terminalName && (
                        <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                          at {partner.terminalName} {partner.terminalCode ? `(${partner.terminalCode})` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className={cn("shrink-0 rounded-lg", isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Marketer Context Banner */}
      <Card className={cn(cardCls, "overflow-hidden")}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 shrink-0">
              <Droplets className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className={cn("text-sm font-semibold mb-1", isLight ? "text-slate-700" : "text-white")}>Shipper vs. Marketer in Oil Trucking</h3>
              <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                A <strong>shipper</strong> is the entity tendering product for transport. A <strong>marketer</strong> (oil jobber/wholesaler) 
                buys fuel in bulk from refineries and resells to retail stations, commercial users, or farmers. A shipper becomes a marketer 
                when they directly sell or direct product to a buyer. Partners classified as marketers have enhanced supply chain tracking 
                including product sourcing, buy/sell ledger, and customer distribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="flex min-h-full items-center justify-center p-4">
          <div className={cn("w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden", isLight ? "bg-white border-slate-200" : "bg-[#12121a] border-white/[0.08]")}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Add Supply Chain Partner</h2>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>Link a shipper, marketer, broker, or transporter to your terminal</p>
                </div>
                <button onClick={() => { setShowAddModal(false); resetAddForm(); }} className={cn("p-1.5 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
                  <XCircle className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-slate-500")} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Company Search */}
              <div ref={companySuggestRef} className="relative">
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Company *</label>
                {apSelectedCompany ? (
                  <div className={cn("flex items-center justify-between p-3 rounded-xl border", 
                    apSelectedCompany.onPlatform 
                      ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")
                      : (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")
                  )}>
                    <div className="flex items-center gap-2">
                      {apSelectedCompany.onPlatform ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold", apSelectedCompany.onPlatform ? (isLight ? "text-emerald-700" : "text-emerald-400") : (isLight ? "text-blue-700" : "text-blue-400"))}>{apSelectedCompany.name}</p>
                          {apSelectedCompany.onPlatform ? (
                            <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")}>On Platform</Badge>
                          ) : apSelectedCompany.fmcsaVerified ? (
                            <Badge className={cn("text-[8px] px-1.5 py-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")}>FMCSA Verified</Badge>
                          ) : null}
                        </div>
                        <p className={cn("text-[10px]", apSelectedCompany.onPlatform ? (isLight ? "text-emerald-600/70" : "text-emerald-400/50") : (isLight ? "text-blue-600/70" : "text-blue-400/50"))}>
                          {[apSelectedCompany.dotNumber && `DOT ${apSelectedCompany.dotNumber}`, apSelectedCompany.mcNumber && `MC ${apSelectedCompany.mcNumber}`, apSelectedCompany.city && `${apSelectedCompany.city}, ${apSelectedCompany.state}`].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => { setApSelectedCompany(null); setApCompanySearch(""); setShowInviteForm(false); }} className={cn("p-1 rounded-lg", apSelectedCompany.onPlatform ? (isLight ? "hover:bg-emerald-100" : "hover:bg-emerald-500/20") : (isLight ? "hover:bg-blue-100" : "hover:bg-blue-500/20"))}>
                      <XCircle className={cn("w-4 h-4", apSelectedCompany.onPlatform ? "text-emerald-500" : "text-blue-500")} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
                      <Input
                        value={apCompanySearch}
                        onChange={(e) => { setApCompanySearch(e.target.value); if (e.target.value.length >= 2) setApShowCompanySuggestions(true); else setApShowCompanySuggestions(false); }}
                        onFocus={() => { if (apCompanySearch.length >= 2) setApShowCompanySuggestions(true); }}
                        placeholder="Search by company name, DOT#, or MC#..."
                        className={cn("pl-10", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")} />
                    </div>
                    {apShowCompanySuggestions && (companySearchQ.data as any[])?.length > 0 && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl max-h-56 overflow-y-auto", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600/50")}>
                        {(companySearchQ.data as any[]).map((c: any, idx: number) => (
                          <button key={c.id || `fmcsa-${idx}`} className={cn("w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 border-b last:border-0 transition-colors", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/50 border-slate-700/20")} onClick={() => {
                            setApSelectedCompany(c); setApShowCompanySuggestions(false); setApCompanySearch(c.name);
                            if (!c.onPlatform) setShowInviteForm(true);
                          }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn("text-sm font-medium truncate", isLight ? "text-slate-800" : "text-white")}>{c.name}</p>
                                {c.onPlatform ? (
                                  <Badge className={cn("text-[8px] px-1.5 py-0 shrink-0", isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")}>
                                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />On Platform
                                  </Badge>
                                ) : c.fmcsaVerified ? (
                                  <Badge className={cn("text-[8px] px-1.5 py-0 shrink-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")}>
                                    <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />FMCSA
                                  </Badge>
                                ) : null}
                              </div>
                              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                                {[c.dotNumber && `DOT ${c.dotNumber}`, c.mcNumber && `MC ${c.mcNumber}`, c.city && `${c.city}, ${c.state}`, c.hmFlag === "Y" && "Hazmat"].filter(Boolean).join(" • ")}
                              </p>
                            </div>
                            {!c.onPlatform && (
                              <span className={cn("text-[9px] font-medium flex items-center gap-1 shrink-0", isLight ? "text-purple-600" : "text-purple-400")}>
                                <UserPlus className="w-3 h-3" />Invite
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {apShowCompanySuggestions && apCompanySearch.length >= 2 && companySearchQ.isLoading && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border p-3", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600/50")}>
                        <p className="text-xs text-slate-400">Searching companies...</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Invite Form for non-platform companies */}
              {apSelectedCompany && !apSelectedCompany.onPlatform && showInviteForm && (
                <div className={cn("p-4 rounded-xl border space-y-3", isLight ? "bg-purple-50/50 border-purple-200" : "bg-purple-500/5 border-purple-500/20")}>
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <p className={cn("text-sm font-semibold", isLight ? "text-purple-700" : "text-purple-400")}>Invite to EusoTrip</p>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-purple-600/70" : "text-purple-400/60")}>
                    This company isn't on EusoTrip yet. Send them an invitation via SMS or email.
                  </p>
                  {/* Method Toggle */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInviteMethod("email")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "email"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600 hover:border-purple-300" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Mail className="w-3.5 h-3.5" />Email
                    </button>
                    <button onClick={() => setInviteMethod("sms")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "sms"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600 hover:border-purple-300" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Phone className="w-3.5 h-3.5" />SMS
                    </button>
                  </div>
                  {/* Contact Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={inviteContact || (inviteMethod === "email" ? (apSelectedCompany.email || "") : (apSelectedCompany.phone || ""))}
                      onChange={(e) => setInviteContact(e.target.value)}
                      placeholder={inviteMethod === "email" ? "company@example.com" : "+1 (555) 123-4567"}
                      className={cn("flex-1", isLight ? "bg-white border-purple-200" : "bg-white/[0.04] border-purple-500/20")}
                    />
                    <Button
                      onClick={() => {
                        const contact = inviteContact || (inviteMethod === "email" ? apSelectedCompany.email : apSelectedCompany.phone);
                        if (!contact) { toast.error(`Enter ${inviteMethod === "email" ? "an email" : "a phone number"}`); return; }
                        const terminalName = (myTerminalsQ.data as any[])?.[0]?.name || "their terminal";
                        invitePartnerMut.mutate({
                          companyName: apSelectedCompany.name,
                          dotNumber: apSelectedCompany.dotNumber || undefined,
                          method: inviteMethod,
                          contact,
                          partnerType: apPartnerType,
                          terminalName,
                        });
                      }}
                      disabled={invitePartnerMut.isPending}
                      className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-semibold text-xs px-4"
                    >
                      {invitePartnerMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Partner Type */}
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-400" : "text-white/30")}>Partner Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["shipper", "marketer", "broker", "transporter"] as const).map((t) => (
                    <button key={t} onClick={() => setApPartnerType(t)} className={cn(
                      "px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize",
                      apPartnerType === t
                        ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                        : isLight ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300" : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                    )}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Rack Access Level */}
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-400" : "text-white/30")}>Rack Access Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["full", "limited", "scheduled"] as const).map((level) => (
                    <button key={level} onClick={() => setApRackAccess(level)} className={cn(
                      "px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize",
                      apRackAccess === level
                        ? (level === "full" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500" : level === "limited" ? "bg-amber-500/15 border-amber-500/30 text-amber-500" : "bg-blue-500/15 border-blue-500/30 text-blue-500")
                        : isLight ? "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300" : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                    )}>{level}</button>
                  ))}
                </div>
              </div>

              {/* Volume + Products */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Monthly Volume (bbl)</label>
                  <Input type="number" value={apVolume} onChange={(e) => setApVolume(e.target.value)} placeholder="e.g., 50000" className={cn(isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")} />
                </div>
                <div>
                  <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Products (comma-sep)</label>
                  <Input value={apProducts} onChange={(e) => setApProducts(e.target.value)} placeholder="Gasoline, Diesel, Jet A" className={cn(isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Notes</label>
                <Input value={apNotes} onChange={(e) => setApNotes(e.target.value)} placeholder="Special instructions or context..." className={cn(isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("px-6 py-4 border-t flex items-center justify-end gap-3", isLight ? "border-slate-100 bg-slate-50" : "border-white/[0.04] bg-white/[0.02]")}>
              <Button variant="ghost" onClick={() => { setShowAddModal(false); resetAddForm(); }} className={cn("rounded-xl text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Cancel</Button>
              {/* Only show Add Partner for platform users with valid id */}
              {apSelectedCompany?.onPlatform && apSelectedCompany?.id ? (
                <Button onClick={handleAddPartner} disabled={addPartnerMut.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6">
                  {addPartnerMut.isPending ? "Adding..." : "Add Partner"}
                </Button>
              ) : apSelectedCompany && !apSelectedCompany.onPlatform ? (
                <div className={cn("text-xs px-4 py-2 rounded-xl", isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400")}>
                  <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />Send invite above to link this partner
                </div>
              ) : (
                <Button disabled className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6 opacity-30">
                  Add Partner
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
