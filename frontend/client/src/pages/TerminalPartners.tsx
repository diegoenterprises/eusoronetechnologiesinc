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
import { useState } from "react";
import {
  Building2, Users, TrendingUp, Package, Search,
  ArrowRight, Shield, Truck, BarChart3, Filter,
  Plus, ChevronDown, MapPin, Activity, Droplets,
  CheckCircle, Clock, AlertTriangle, XCircle
} from "lucide-react";

type PartnerFilter = "all" | "shipper" | "marketer" | "broker" | "transporter";

export default function TerminalPartners() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [filter, setFilter] = useState<PartnerFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm">
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
    </div>
  );
}
