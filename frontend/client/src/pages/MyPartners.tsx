/**
 * MY PARTNERS — Generalized Supply Chain Partner Management
 * 
 * Every role sees partner types relevant to them:
 *   Shipper → Carriers, Brokers, Terminals, Dispatch
 *   Catalyst → Shippers, Brokers, Drivers, Escorts, Terminals
 *   Broker → Shippers, Carriers, Terminals, Dispatch
 *   Driver → Carrier, Dispatcher
 *   Escort → Carrier
 *   Dispatch → Carriers, Shippers, Drivers
 *   Terminal Manager → Shippers, Carriers, Brokers (also has dedicated page)
 *   Compliance/Safety → Carriers, Shippers, Drivers
 * 
 * Theme-aware | Jony Ive design | Platform standard
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { toast } from "sonner";
import { Portal } from "@/components/ui/portal";
import {
  Users, Search, Plus, ChevronDown, MapPin, Building2,
  Truck, Package, Shield, UserPlus, CheckCircle, Clock,
  AlertTriangle, XCircle, BadgeCheck, Send, Mail, Phone,
  Loader2, ArrowUpRight, ArrowDownLeft, MoreHorizontal,
  Handshake, Activity, Filter, PenTool, FileWarning,
} from "lucide-react";

const AgreementsLibrary = lazy(() => import("./AgreementsLibrary"));

type PartnerType = { toRole: string; relationship: string; label: string; description: string };

const ROLE_ICONS: Record<string, any> = {
  SHIPPER: Package, CATALYST: Truck, BROKER: Building2, DRIVER: Truck,
  DISPATCH: Activity, ESCORT: Shield, TERMINAL_MANAGER: Building2,
  COMPLIANCE_OFFICER: Shield, SAFETY_MANAGER: Shield, FACTORING: Building2,
};

const ROLE_COLORS: Record<string, { text: string; bg: string; light: string; lightBg: string }> = {
  SHIPPER: { text: "text-blue-500", bg: "bg-blue-500/15", light: "text-blue-700", lightBg: "bg-blue-100" },
  CATALYST: { text: "text-orange-500", bg: "bg-orange-500/15", light: "text-orange-700", lightBg: "bg-orange-100" },
  BROKER: { text: "text-cyan-500", bg: "bg-cyan-500/15", light: "text-cyan-700", lightBg: "bg-cyan-100" },
  DRIVER: { text: "text-emerald-500", bg: "bg-emerald-500/15", light: "text-emerald-700", lightBg: "bg-emerald-100" },
  DISPATCH: { text: "text-violet-500", bg: "bg-violet-500/15", light: "text-violet-700", lightBg: "bg-violet-100" },
  ESCORT: { text: "text-amber-500", bg: "bg-amber-500/15", light: "text-amber-700", lightBg: "bg-amber-100" },
  TERMINAL_MANAGER: { text: "text-indigo-500", bg: "bg-indigo-500/15", light: "text-indigo-700", lightBg: "bg-indigo-100" },
  COMPLIANCE_OFFICER: { text: "text-rose-500", bg: "bg-rose-500/15", light: "text-rose-700", lightBg: "bg-rose-100" },
  SAFETY_MANAGER: { text: "text-red-500", bg: "bg-red-500/15", light: "text-red-700", lightBg: "bg-red-100" },
};

// Roles that deal with commodity volumes & products (shippers, carriers, brokers, terminals)
const COMMODITY_ROLES = new Set(["SHIPPER", "CATALYST", "BROKER", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"]);
// Rack access only relevant when partnering with a terminal
const RACK_ACCESS_TARGET = "TERMINAL_MANAGER";

export default function MyPartners() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const userRole = (user?.role || "SHIPPER").toUpperCase();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState<number | null>(null);

  // Add Partner modal state
  const [apCompanySearch, setApCompanySearch] = useState("");
  const [apShowSuggestions, setApShowSuggestions] = useState(false);
  const [apSelectedCompany, setApSelectedCompany] = useState<any>(null);
  const [apSelectedType, setApSelectedType] = useState<PartnerType | null>(null);
  const [apNotes, setApNotes] = useState("");
  const [apRackAccess, setApRackAccess] = useState<"full" | "limited" | "scheduled">("scheduled");
  const [apVolume, setApVolume] = useState("");
  const [apProducts, setApProducts] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<"sms" | "email">("email");
  const [inviteContact, setInviteContact] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

  // Queries
  const configQ = (trpc as any).supplyChain?.getPartnerConfig?.useQuery?.() || { data: null };
  const partnersQ = (trpc as any).supplyChain?.getMyPartners?.useQuery?.(
    filterRole !== "all" ? { toRole: filterRole } : {},
    { staleTime: 30_000 }
  ) || { data: null, isLoading: false };
  const statsQ = (trpc as any).supplyChain?.getPartnershipStats?.useQuery?.(undefined, { staleTime: 30_000 }) || { data: null };
  const companySearchQ = (trpc as any).supplyChain?.searchCompanies?.useQuery?.(
    { query: apCompanySearch },
    { enabled: apCompanySearch.length >= 2, staleTime: 15000 }
  ) || { data: null, isLoading: false };

  // Mutations
  const addMut = (trpc as any).supplyChain?.addPartnership?.useMutation?.({
    onSuccess: () => {
      toast.success("Partner added", { description: `${apSelectedCompany?.name || "Company"} linked as ${apSelectedType?.label || "partner"}` });
      setShowAddModal(false);
      resetForm();
      partnersQ.refetch?.();
      statsQ.refetch?.();
    },
    onError: (err: any) => toast.error("Failed to add partner", { description: err?.message }),
  }) || { mutate: () => toast.error("Not available"), isPending: false };

  const updateStatusMut = (trpc as any).supplyChain?.updatePartnershipStatus?.useMutation?.({
    onSuccess: () => { toast.success("Partnership updated"); partnersQ.refetch?.(); statsQ.refetch?.(); setShowStatusMenu(null); },
    onError: (err: any) => toast.error("Update failed", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const inviteMut = (trpc as any).supplyChain?.inviteAndPartner?.useMutation?.({
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success("Invite sent!", { description: `Invitation sent via ${res.method}` });
        setShowInviteForm(false);
        setInviteContact("");
      } else {
        toast.error("Invite failed", { description: res?.error || "Unknown error" });
      }
    },
    onError: (err: any) => toast.error("Invite failed", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const resetForm = useCallback(() => {
    setApCompanySearch("");
    setApSelectedCompany(null);
    setApSelectedType(null);
    setApNotes("");
    setApRackAccess("scheduled");
    setApVolume("");
    setApProducts("");
    setShowInviteForm(false);
    setInviteContact("");
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setApShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const config = configQ.data as { heading: string; subheading: string; partnerTypes: PartnerType[] } | null;
  const partners = (partnersQ.data || []) as any[];
  const stats = statsQ.data as any;

  const filteredPartners = searchQuery
    ? partners.filter((p: any) =>
        p.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyDot?.includes(searchQuery) ||
        p.companyMc?.includes(searchQuery)
      )
    : partners;

  // Style classes
  const cardCls = cn("rounded-2xl border transition-all", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const subtextCls = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const getStatusBadge = (status: string) => {
    const m: Record<string, { cls: string; icon: any; label: string }> = {
      active: { cls: isLight ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle, label: "Active" },
      pending: { cls: isLight ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock, label: "Pending" },
      declined: { cls: isLight ? "bg-red-100 text-red-700 border-red-200" : "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Declined" },
      suspended: { cls: isLight ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle, label: "Suspended" },
      terminated: { cls: isLight ? "bg-red-100 text-red-700 border-red-200" : "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "Terminated" },
    };
    const s = m[status] || m.pending;
    const Icon = s.icon;
    return <Badge className={cn("border text-[10px] font-semibold px-2 py-0.5 gap-1", s.cls)}><Icon className="w-3 h-3" />{s.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = ROLE_COLORS[role] || ROLE_COLORS.SHIPPER;
    const label = role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return <Badge className={cn("border text-[10px] font-semibold px-2 py-0.5", isLight ? `${colors.lightBg} ${colors.light} border-transparent` : `${colors.bg} ${colors.text} border-transparent`)}>{label}</Badge>;
  };

  const getAgreementBadge = (agreementStatus: string | null) => {
    if (!agreementStatus) return null;
    const m: Record<string, { cls: string; icon: any; label: string }> = {
      active: { cls: isLight ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: PenTool, label: "Active Agreement" },
      pending: { cls: isLight ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock, label: "Pending Agreement" },
      expired: { cls: isLight ? "bg-red-100 text-red-700 border-red-300" : "bg-red-500/15 text-red-400 border-red-500/30", icon: FileWarning, label: "Agreement Expired" },
    };
    const s = m[agreementStatus];
    if (!s) return null;
    const Icon = s.icon;
    return <Badge className={cn("border text-[10px] font-semibold px-2 py-0.5 gap-1", s.cls)}><Icon className="w-3 h-3" />{s.label}</Badge>;
  };

  const handleAddPartner = useCallback(() => {
    if (!apSelectedCompany || !apSelectedType) { toast.error("Select a company and partner type"); return; }
    const metaNotes = JSON.stringify({
      text: apNotes || "",
      rackAccessLevel: apRackAccess,
      monthlyVolume: apVolume ? parseInt(apVolume) : null,
      products: apProducts ? apProducts.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    });
    addMut.mutate({
      toCompanyId: apSelectedCompany.id,
      toRole: apSelectedType.toRole,
      relationshipType: apSelectedType.relationship,
      notes: metaNotes,
    });
  }, [apSelectedCompany, apSelectedType, apNotes, apRackAccess, apVolume, apProducts]);

  // Build filter tabs from config
  const filterTabs = [
    { key: "all", label: "All" },
    ...(config?.partnerTypes || []).map(pt => ({ key: pt.toRole, label: pt.label })),
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {config?.heading || "My Partners"}
          </h1>
          <p className={subtextCls}>{config?.subheading || "Partners, agreements & supply chain connections"}</p>
        </div>
      </div>

      <Tabs defaultValue="partners" className="space-y-6">
        <TabsList className={cn("border rounded-lg p-1", isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <TabsTrigger value="partners" className={cn("data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white rounded-md px-4 py-2 text-sm gap-2", isLight ? "text-slate-600" : "")}>
            <Handshake className="w-4 h-4" />Partners
          </TabsTrigger>
          <TabsTrigger value="agreements" className={cn("data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF] data-[state=active]:to-[#BE01FF] data-[state=active]:text-white rounded-md px-4 py-2 text-sm gap-2", isLight ? "text-slate-600" : "")}>
            <PenTool className="w-4 h-4" />Agreements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm">
              <Plus className="w-4 h-4 mr-2" />Add Partner
            </Button>
          </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Partners", value: stats?.total || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/15" },
          { label: "Active", value: stats?.active || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/15" },
          { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/15" },
          { label: "Partner Types", value: config?.partnerTypes?.length || 0, icon: Handshake, color: "text-purple-500", bg: "bg-purple-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className={cardCls}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div>
                  {statsQ.isLoading ? (
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
        <div className={cn("flex items-center gap-1 p-1 rounded-xl border overflow-x-auto", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterRole(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                filterRole === tab.key
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

      {/* Partner List */}
      <div className="space-y-3">
        {partnersQ.isLoading ? (
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
              <Handshake className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
              <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                {searchQuery ? "No partners match your search" : "No supply chain partners yet"}
              </p>
              <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                Click "Add Partner" to connect with companies in your supply chain
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPartners.map((partner: any) => {
            const role = partner.direction === "outbound" ? partner.toRole : partner.fromRole;
            const colors = ROLE_COLORS[role] || ROLE_COLORS.SHIPPER;
            const RoleIcon = ROLE_ICONS[role] || Users;
            return (
              <Card key={partner.id} className={cn(cardCls, "hover:shadow-md transition-shadow")}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl shrink-0", isLight ? colors.lightBg : colors.bg)}>
                      <RoleIcon className={cn("w-5 h-5", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>{partner.companyName || "Unknown Company"}</h3>
                        {getRoleBadge(role)}
                        {getStatusBadge(partner.status || "pending")}
                        {getAgreementBadge(partner.agreementStatus)}
                        {partner.direction === "inbound" && (
                          <Badge className={cn("border text-[10px] px-2 py-0.5", isLight ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-slate-700/50 text-slate-400 border-slate-600/30")}>
                            <ArrowDownLeft className="w-3 h-3 mr-0.5" />Added you
                          </Badge>
                        )}
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
                        {partner.relationshipType && (
                          <span className={cn("text-[10px] capitalize", isLight ? "text-slate-400" : "text-slate-500")}>
                            {partner.relationshipType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {partner.notes && (
                        <p className={cn("text-xs mt-2 italic", isLight ? "text-slate-400" : "text-slate-500")}>{partner.notes}</p>
                      )}
                    </div>
                    {/* Status dropdown */}
                    <div className="relative shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStatusMenu(showStatusMenu === partner.id ? null : partner.id)}
                        className={cn("rounded-lg", isLight ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white")}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {showStatusMenu === partner.id && (
                        <div className={cn("absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl min-w-[160px] py-1", isLight ? "bg-white border-slate-200" : "border-slate-600/50")} style={isLight ? undefined : { backgroundColor: '#0c0e18' }}>
                          {(["active", "suspended", "terminated"] as const).map((s) => (
                            <button
                              key={s}
                              disabled={partner.status === s}
                              onClick={() => updateStatusMut.mutate({ partnershipId: partner.id, status: s })}
                              className={cn(
                                "w-full text-left px-4 py-2 text-xs font-medium transition-colors capitalize",
                                partner.status === s ? "opacity-30" : "",
                                isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-700/50 text-slate-300"
                              )}
                            >
                              {s === "active" ? "Activate" : s === "suspended" ? "Suspend" : "Terminate"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
        </TabsContent>

        <TabsContent value="agreements">
          <Suspense fallback={<div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className={cn("h-32 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>}>
            <AgreementsLibrary />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Add Partner Modal */}
      {showAddModal && (
        <Portal>
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); resetForm(); } }}>
          <div className={cn("w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden", isLight ? "bg-white border-slate-200" : "bg-[#12121a] border-white/[0.08]")}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b shrink-0" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Add Supply Chain Partner</h2>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>Search for a company or invite someone new to EusoTrip</p>
                </div>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className={cn("p-1.5 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
                  <XCircle className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-slate-500")} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {/* Partner Type Selection */}
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1.5 block", isLight ? "text-slate-400" : "text-white/30")}>What type of partner? *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(config?.partnerTypes || []).map((pt) => {
                    const Icon = ROLE_ICONS[pt.toRole] || Users;
                    const isSelected = apSelectedType?.toRole === pt.toRole && apSelectedType?.relationship === pt.relationship;
                    return (
                      <button
                        key={`${pt.toRole}-${pt.relationship}`}
                        onClick={() => setApSelectedType(pt)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          isSelected
                            ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/40 shadow-sm"
                            : isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", isSelected ? "text-[#1473FF]" : isLight ? "text-slate-400" : "text-slate-500")} />
                          <span className={cn("text-xs font-semibold", isSelected ? (isLight ? "text-[#1473FF]" : "text-white") : isLight ? "text-slate-700" : "text-slate-300")}>{pt.label}</span>
                        </div>
                        <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{pt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Company Search */}
              <div ref={suggestRef} className="relative">
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Company *</label>
                {apSelectedCompany ? (
                  <div className={cn("flex items-center justify-between p-3 rounded-xl border",
                    apSelectedCompany.onPlatform
                      ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")
                      : (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/20")
                  )}>
                    <div className="flex items-center gap-2">
                      {apSelectedCompany.onPlatform ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <BadgeCheck className="w-4 h-4 text-blue-500" />}
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
                    <button onClick={() => { setApSelectedCompany(null); setApCompanySearch(""); setShowInviteForm(false); }} className={cn("p-1 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
                      <XCircle className={cn("w-4 h-4", apSelectedCompany.onPlatform ? "text-emerald-500" : "text-blue-500")} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
                      <Input
                        value={apCompanySearch}
                        onChange={(e) => { setApCompanySearch(e.target.value); if (e.target.value.length >= 2) setApShowSuggestions(true); else setApShowSuggestions(false); }}
                        onFocus={() => { if (apCompanySearch.length >= 2) setApShowSuggestions(true); }}
                        placeholder="Search by company name, DOT#, or MC#..."
                        className={cn("pl-10", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                      />
                    </div>
                    {apShowSuggestions && (companySearchQ.data as any[])?.length > 0 && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl max-h-56 overflow-y-auto", isLight ? "bg-white border-slate-200" : "border-slate-600/50")} style={isLight ? undefined : { backgroundColor: '#0c0e18' }}>
                        {(companySearchQ.data as any[]).map((c: any, idx: number) => (
                          <button key={c.id || `fmcsa-${idx}`} className={cn("w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 border-b last:border-0 transition-colors", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/50 border-slate-700/20")} onClick={() => {
                            setApSelectedCompany(c);
                            setApShowSuggestions(false);
                            setApCompanySearch(c.name);
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
                                {[c.dotNumber && `DOT ${c.dotNumber}`, c.mcNumber && `MC ${c.mcNumber}`, c.city && `${c.city}, ${c.state}`].filter(Boolean).join(" • ")}
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
                    {apShowSuggestions && apCompanySearch.length >= 2 && companySearchQ.isLoading && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border p-3", isLight ? "bg-white border-slate-200" : "border-slate-600/50")} style={isLight ? undefined : { backgroundColor: '#0c0e18' }}>
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
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInviteMethod("email")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "email"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Mail className="w-3.5 h-3.5" />Email
                    </button>
                    <button onClick={() => setInviteMethod("sms")} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      inviteMethod === "sms"
                        ? "bg-purple-500 text-white border-purple-500"
                        : isLight ? "bg-white border-purple-200 text-purple-600" : "bg-white/[0.04] border-purple-500/30 text-purple-400"
                    )}>
                      <Phone className="w-3.5 h-3.5" />SMS
                    </button>
                  </div>
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
                        if (!apSelectedType) { toast.error("Select a partner type first"); return; }
                        inviteMut.mutate({
                          companyName: apSelectedCompany.name,
                          dotNumber: apSelectedCompany.dotNumber || undefined,
                          method: inviteMethod,
                          contact,
                          toRole: apSelectedType.toRole,
                          relationshipType: apSelectedType.relationship,
                        });
                      }}
                      disabled={inviteMut.isPending}
                      className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-semibold text-xs px-4"
                    >
                      {inviteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rack Access Level — only when partnering with a Terminal */}
              {apSelectedType?.toRole === RACK_ACCESS_TARGET && (
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
              )}

              {/* Volume + Products — only for commodity roles (Shipper, Catalyst, Broker, Terminal, Admin) */}
              {COMMODITY_ROLES.has(userRole) && (
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
              )}

              {/* Notes */}
              <div>
                <label className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1 block", isLight ? "text-slate-400" : "text-white/30")}>Notes</label>
                <Input
                  value={apNotes}
                  onChange={(e) => setApNotes(e.target.value)}
                  placeholder="Special instructions or context..."
                  className={cn(isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/[0.08]")}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className={cn("px-6 py-4 border-t flex items-center justify-end gap-3 shrink-0", isLight ? "border-slate-100 bg-slate-50" : "border-white/[0.04] bg-white/[0.02]")}>
              <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }} className={cn("rounded-xl text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Cancel</Button>
              {apSelectedCompany?.onPlatform && apSelectedCompany?.id ? (
                <Button onClick={handleAddPartner} disabled={addMut.isPending || !apSelectedType} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm px-6">
                  {addMut.isPending ? "Adding..." : "Add Partner"}
                </Button>
              ) : apSelectedCompany && !apSelectedCompany.onPlatform ? (
                <div className={cn("text-xs px-4 py-2 rounded-xl", isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400")}>
                  <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />Send invite above to connect
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
        </Portal>
      )}
    </div>
  );
}
