/**
 * AGREEMENTS LIBRARY — Unified agreement management for shipper, catalyst, broker
 * Theme-aware | Brand gradient | All contract types
 *
 * Shows: active, pending, draft, expired agreements
 * Actions: create new, attach to load, view detail, sign pending
 * Dynamic fee calculation handled by platform fee engine
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  FileText, CheckCircle, Plus, Shield, DollarSign,
  Clock, Building2, Search, Filter,
  AlertTriangle, Eye, PenTool, Truck, Users, Repeat,
  ChevronRight, ArrowUpRight, Calendar, Download
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type TabFilter = "all" | "active" | "pending" | "draft" | "expired";
type TypeFilter = "all" | "spot" | "short_term" | "long_term" | "master_service";


export default function AgreementsLibrary() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<TabFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const role = user?.role || "SHIPPER";
  const isBroker = role === "BROKER";
  const isCatalyst = role === "CATALYST";
  const isTerminal = role === "TERMINAL_MANAGER";

  // Fetch agreements
  const agQuery = (trpc as any).agreements?.list?.useQuery?.({ status: tab === "all" ? undefined : tab, limit: 50 }) || { data: [], isLoading: false };
  const statsQuery = (trpc as any).agreements?.getStats?.useQuery?.() || { data: null, isLoading: false };

  const agData = agQuery.data;
  const agreements: any[] = Array.isArray(agData) ? agData : Array.isArray(agData?.agreements) ? agData.agreements : [];
  const rawStats = statsQuery.data;
  const stats = {
    total: rawStats?.total ?? 0,
    active: rawStats?.active ?? 0,
    pending: rawStats?.pending ?? rawStats?.pendingSignature ?? 0,
    draft: rawStats?.draft ?? 0,
    expired: rawStats?.expired ?? 0,
  };

  // Filter — safe: agreements is always an array
  const filtered = agreements.filter((a: any) => {
    if (typeFilter !== "all" && a.contractDuration !== typeFilter && a.agreementType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = [a.agreementNumber, a.partyBName, a.partyBCompany, a.agreementType].some(v => v?.toLowerCase?.()?.includes?.(q));
      if (!match) return false;
    }
    return true;
  });

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const ic = cn("rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-green-500/15 text-green-500 border-green-500/30";
      case "pending_signature": case "pending_review": return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
      case "draft": return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "expired": case "terminated": return "bg-red-500/15 text-red-400 border-red-500/30";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "catalyst_shipper": return "Catalyst Shipper";
      case "carrier_shipper": return "Catalyst Shipper";
      case "master_service": return "MSA";
      case "lane_commitment": return "Lane Commitment";
      case "broker_catalyst": return "Broker-Catalyst";
      case "broker_shipper": return "Broker-Shipper";
      case "catalyst_driver": return "Catalyst-Driver";
      case "escort_service": return "Escort Service";
      case "dispatch_dispatch": return "Dispatch Service";
      case "terminal_access": return "Terminal Access";
      case "fuel_surcharge": return "Fuel Surcharge";
      case "accessorial_schedule": return "Accessorial Schedule";
      case "nda": return "NDA";
      case "factoring": return "Factoring";
      case "custom": return "Custom";
      default: return t?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Agreement";
    }
  };

  const durationLabel = (d: string) => {
    switch (d) {
      case "spot": return "Spot";
      case "short_term": return "Short Term";
      case "long_term": return "Long Term";
      case "evergreen": return "Evergreen";
      default: return d?.replace(/_/g, " ") || "";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Agreements</h1>
          <p className={mt}>{isTerminal ? "Terminal access, throughput & service agreements" : isBroker ? "Manage shipper & catalyst contracts" : isCatalyst ? "View & sign shipper agreements" : "Manage catalyst agreements & contracts"}</p>
        </div>
        <div className="flex gap-2">
          {!isCatalyst && (
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold h-10" onClick={() => setLocation("/agreements/create")}>
              <Plus className="w-4 h-4 mr-2" />New Agreement
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total || agreements.length, icon: <FileText className="w-4 h-4" />, color: "text-blue-500" },
          { label: "Active", value: stats.active, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500" },
          { label: "Pending", value: stats.pending, icon: <Clock className="w-4 h-4" />, color: "text-yellow-500" },
          { label: "Draft", value: stats.draft, icon: <PenTool className="w-4 h-4" />, color: "text-blue-400" },
          { label: "Expired", value: stats.expired, icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className={cl}>
            <div className="flex items-center gap-2 mb-1"><span className={s.color}>{s.icon}</span><span className="text-[10px] uppercase text-slate-400 font-bold">{s.label}</span></div>
            <p className={cn("text-xl font-bold", vl)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isTerminal ? "Search by agreement #, shipper, company..." : "Search by agreement #, catalyst, company..."} className={cn("pl-10", ic)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["all", "active", "pending", "draft", "expired"] as TabFilter[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              tab === t ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}>{t === "all" ? "All" : t.replace(/\b\w/g, c => c.toUpperCase())}</button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["all", "spot", "short_term", "long_term", "master_service"] as TypeFilter[]).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              typeFilter === t ? "bg-gradient-to-r from-[#1473FF]/80 to-[#BE01FF]/80 text-white" : isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400"
            )}>{t === "all" ? "All Types" : durationLabel(t) || typeLabel(t)}</button>
          ))}
        </div>
      </div>

      {/* Agreement List */}
      {agQuery.isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={cn("h-24 rounded-2xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />)}</div>
      ) : filtered.length === 0 ? (
        <Card className={cc}>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center">
              <PenTool className="w-8 h-8 text-slate-400" />
            </div>
            <p className={cn("font-bold text-lg mb-1", vl)}>No agreements yet</p>
            <p className={cn("text-sm mb-6", mt)}>{isTerminal ? "Create terminal access, throughput, or storage agreements with shippers and transporters." : isCatalyst ? "Agreements will appear here when shippers send you contracts to sign." : "Create your first agreement to start managing catalyst contracts."}</p>
            {!isCatalyst && <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/agreements/create")}><Plus className="w-4 h-4 mr-2" />{isTerminal ? "Create Agreement" : "Create Agreement"}</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ag: any, i: number) => (
            <Card key={ag.id || i} className={cn(cc, "hover:shadow-md transition-shadow cursor-pointer")} onClick={() => ag.id && setLocation(`/agreements/${ag.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      ag.status === "active" ? "bg-green-500/15" : ag.status === "draft" ? "bg-blue-500/15" : "bg-slate-500/15"
                    )}>
                      {ag.status === "active" ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       ag.status?.includes?.("pending") ? <Clock className="w-5 h-5 text-yellow-500" /> :
                       <FileText className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-bold text-sm", vl)}>#{ag.agreementNumber || `AG-${ag.id}`}</p>
                        <Badge className={cn("border text-[10px] font-bold", statusColor(ag.status))}>{ag.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Draft"}</Badge>
                        <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-[10px]">{typeLabel(ag.agreementType)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{ag.partyBCompany || ag.partyBName || "Catalyst TBD"}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{ag.effectiveDate ? new Date(ag.effectiveDate).toLocaleDateString() : "No date"}</span>
                        {ag.contractDuration && <span className="text-xs text-slate-400">{durationLabel(ag.contractDuration)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {ag.baseRate && (
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${parseFloat(ag.baseRate).toLocaleString()}</p>
                      </div>
                    )}
                    <Button size="sm" variant="ghost" className={cn("rounded-lg h-8 w-8 p-0", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")} onClick={(e: React.MouseEvent) => { e.stopPropagation(); downloadAgreementPdf({ agreementNumber: ag.agreementNumber || `AG-${ag.id}`, agreementType: ag.agreementType || "catalyst_shipper", contractDuration: ag.contractDuration, status: ag.status, generatedContent: ag.generatedContent || "Agreement content not available — open the agreement to view full details.", partyAName: ag.partyAName || user?.name, partyARole: ag.partyARole || role, partyBName: ag.partyBName || ag.partyBCompany, partyBCompany: ag.partyBCompany, partyBRole: ag.partyBRole || "CATALYST", baseRate: ag.baseRate, rateType: ag.rateType, paymentTermDays: ag.paymentTermDays, effectiveDate: ag.effectiveDate, expirationDate: ag.expirationDate, equipmentTypes: ag.equipmentTypes, hazmatRequired: ag.hazmatRequired }); }}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    {ag.status?.includes?.("pending") && isCatalyst && (
                      <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg font-bold text-xs h-8" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setLocation(`/contract/sign/${ag.loadId || ag.id}`); }}>
                        <Shield className="w-3 h-3 mr-1" />Sign
                      </Button>
                    )}
                    <ChevronRight className={cn("w-4 h-4", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {!isCatalyst && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isTerminal ? (
            <>
              <button onClick={() => setLocation("/agreements/create")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <Shield className="w-5 h-5 text-blue-500 mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Terminal Access Agreement</p>
                <p className="text-xs text-slate-400">Grant shippers & transporters access to your terminal facility</p>
              </button>
              <button onClick={() => setLocation("/agreements/create")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <Truck className="w-5 h-5 text-purple-500 mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Throughput Agreement</p>
                <p className="text-xs text-slate-400">Define volume commitments, rates, and scheduling terms</p>
              </button>
              <button onClick={() => setLocation("/agreements/create")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <Building2 className="w-5 h-5 text-emerald-500 mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Storage & Service Agreement</p>
                <p className="text-xs text-slate-400">Tank storage, blending services, or product handling terms</p>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setLocation("/agreements/create")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <EsangIcon className="w-5 h-5 text-blue-500 mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Generate MSA</p>
                <p className="text-xs text-slate-400">Auto-generate a Master Service Agreement from strategic inputs</p>
              </button>
              <button onClick={() => setLocation("/loads/recurring")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <Repeat className="w-5 h-5 text-purple-500 mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Recurring Loads</p>
                <p className="text-xs text-slate-400">Set up scheduled lanes with dedicated catalysts</p>
              </button>
              <button onClick={() => setLocation("/agreements/create")} className={cn("p-4 rounded-xl border text-left transition-all hover:shadow-md", cl)}>
                <FileText className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-2" />
                <p className={cn("font-bold text-sm", vl)}>Upload Contract</p>
                <p className="text-xs text-slate-400">Digitize an existing contract for electronic signing</p>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
