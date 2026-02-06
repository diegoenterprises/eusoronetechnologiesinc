/**
 * AGREEMENT MANAGEMENT — Central hub for EusoContract system
 * 100% Dynamic - No mock data
 * Tabs: Agreements | Templates | Lane Contracts | Expiring
 * Actions: Create Agreement, Upload, View, Sign
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  FileText, Search, Plus, DollarSign, Calendar, CheckCircle, Clock,
  AlertTriangle, Shield, Handshake, PenLine, Upload, Eye, ArrowRight,
  FileSignature, MapPin, TrendingUp, Users, RefreshCw, X, Filter,
  ChevronRight, Truck, Building2, Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

const AGREEMENT_TYPES = [
  { value: "carrier_shipper", label: "Carrier-Shipper", icon: Truck },
  { value: "broker_carrier", label: "Broker-Carrier", icon: Handshake },
  { value: "broker_shipper", label: "Broker-Shipper", icon: Building2 },
  { value: "carrier_driver", label: "Carrier-Driver", icon: Users },
  { value: "escort_service", label: "Escort Service", icon: Shield },
  { value: "catalyst_dispatch", label: "Dispatch Service", icon: RefreshCw },
  { value: "lane_commitment", label: "Lane Commitment", icon: MapPin },
  { value: "master_service", label: "Master Service", icon: Scale },
  { value: "nda", label: "NDA", icon: FileText },
  { value: "custom", label: "Custom", icon: PenLine },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "negotiating", label: "Negotiating" },
  { value: "pending_signature", label: "Pending Signature" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
];

const DURATION_OPTIONS = [
  { value: "all", label: "All Durations" },
  { value: "spot", label: "Spot" },
  { value: "short_term", label: "Short-Term" },
  { value: "long_term", label: "Long-Term" },
  { value: "evergreen", label: "Evergreen" },
];

function getStatusBadge(status: string) {
  const config: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
    draft: { className: "bg-slate-500/20 text-slate-400", icon: <PenLine className="w-3 h-3 mr-1" />, label: "Draft" },
    pending_review: { className: "bg-blue-500/20 text-blue-400", icon: <Eye className="w-3 h-3 mr-1" />, label: "Review" },
    negotiating: { className: "bg-purple-500/20 text-purple-400", icon: <Handshake className="w-3 h-3 mr-1" />, label: "Negotiating" },
    pending_signature: { className: "bg-amber-500/20 text-amber-400", icon: <FileSignature className="w-3 h-3 mr-1" />, label: "Awaiting Signature" },
    active: { className: "bg-green-500/20 text-green-400", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Active" },
    expired: { className: "bg-red-500/20 text-red-400", icon: <Clock className="w-3 h-3 mr-1" />, label: "Expired" },
    terminated: { className: "bg-red-600/20 text-red-500", icon: <X className="w-3 h-3 mr-1" />, label: "Terminated" },
    renewed: { className: "bg-cyan-500/20 text-cyan-400", icon: <RefreshCw className="w-3 h-3 mr-1" />, label: "Renewed" },
    suspended: { className: "bg-orange-500/20 text-orange-400", icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: "Suspended" },
    cancelled: { className: "bg-slate-600/20 text-slate-500", icon: <X className="w-3 h-3 mr-1" />, label: "Cancelled" },
  };
  const c = config[status] || { className: "bg-slate-500/20 text-slate-400", icon: null, label: status };
  return <Badge className={cn(c.className, "border-0 text-xs")}>{c.icon}{c.label}</Badge>;
}

function getDurationBadge(duration: string) {
  const config: Record<string, string> = {
    spot: "bg-yellow-500/20 text-yellow-400",
    short_term: "bg-blue-500/20 text-blue-400",
    long_term: "bg-green-500/20 text-green-400",
    evergreen: "bg-purple-500/20 text-purple-400",
  };
  const label = duration.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <Badge className={cn(config[duration] || "bg-slate-500/20 text-slate-400", "border-0 text-xs")}>{label}</Badge>;
}

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: number; color: string; loading: boolean;
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-full", color)}><Icon className="w-5 h-5" /></div>
          <div>
            {loading ? <Skeleton className="h-7 w-10" /> : <p className="text-xl font-bold">{value}</p>}
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgreementManagement() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("agreements");

  const statsQuery = (trpc as any).agreements.getStats.useQuery();
  const agreementsQuery = (trpc as any).agreements.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    duration: durationFilter !== "all" ? durationFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const templatesQuery = (trpc as any).agreements.listTemplates.useQuery({});
  const expiringQuery = (trpc as any).agreements.getExpiring.useQuery({ daysAhead: 90 });
  const laneStatsQuery = (trpc as any).laneContracts.getStats.useQuery();
  const lanesQuery = (trpc as any).laneContracts.list.useQuery({ limit: 20 });

  const stats = statsQuery.data;
  const agreementsList = agreementsQuery.data?.agreements || [];
  const templatesList = templatesQuery.data || [];
  const expiringList = expiringQuery.data || [];
  const lanesList = lanesQuery.data?.lanes || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Agreement Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, negotiate, sign, and manage all contracts between platform users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-600 hover:border-slate-500 rounded-lg"
            onClick={() => navigate("/agreement-builder")}
          >
            <Upload className="w-4 h-4 mr-2" />Upload Agreement
          </Button>
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
            onClick={() => navigate("/agreement-builder")}
          >
            <Plus className="w-4 h-4 mr-2" />New Agreement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={FileText} label="Total" value={stats?.total || 0} color="bg-blue-500/20 text-blue-400" loading={statsQuery.isLoading} />
        <StatCard icon={CheckCircle} label="Active" value={stats?.active || 0} color="bg-green-500/20 text-green-400" loading={statsQuery.isLoading} />
        <StatCard icon={PenLine} label="Draft" value={stats?.draft || 0} color="bg-slate-500/20 text-slate-400" loading={statsQuery.isLoading} />
        <StatCard icon={Handshake} label="Negotiating" value={stats?.negotiating || 0} color="bg-purple-500/20 text-purple-400" loading={statsQuery.isLoading} />
        <StatCard icon={FileSignature} label="Pending Sig." value={stats?.pendingSignature || 0} color="bg-amber-500/20 text-amber-400" loading={statsQuery.isLoading} />
        <StatCard icon={AlertTriangle} label="Expired" value={stats?.expired || 0} color="bg-red-500/20 text-red-400" loading={statsQuery.isLoading} />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-lg">
          <TabsTrigger value="agreements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <FileText className="w-4 h-4 mr-2" />Agreements
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <FileSignature className="w-4 h-4 mr-2" />Templates
          </TabsTrigger>
          <TabsTrigger value="lanes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <MapPin className="w-4 h-4 mr-2" />Lane Contracts
          </TabsTrigger>
          <TabsTrigger value="expiring" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1473FF]/20 data-[state=active]:to-[#BE01FF]/20 rounded-md">
            <AlertTriangle className="w-4 h-4 mr-2" />Expiring ({expiringList.length})
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* AGREEMENTS TAB */}
        {/* ============================================================ */}
        <TabsContent value="agreements" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search agreements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="w-[160px] bg-slate-800/50 border-slate-700/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agreements List */}
          {agreementsQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : agreementsList.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No agreements found</h3>
                <p className="text-sm text-slate-500 mt-1 mb-4">Create your first agreement to get started</p>
                <Button
                  className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
                  onClick={() => navigate("/agreement-builder")}
                >
                  <Plus className="w-4 h-4 mr-2" />Create Agreement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {agreementsList.map((agr: any) => (
                <Card
                  key={agr.id}
                  className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/agreement/${agr.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{agr.agreementNumber}</span>
                            {getStatusBadge(agr.status)}
                            {getDurationBadge(agr.contractDuration)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>{agr.agreementType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                            {agr.baseRate && (
                              <>
                                <span className="text-slate-600">|</span>
                                <span className="text-green-400">${parseFloat(agr.baseRate).toLocaleString()} {agr.rateType?.replace(/_/g, "/")}</span>
                              </>
                            )}
                            {agr.effectiveDate && (
                              <>
                                <span className="text-slate-600">|</span>
                                <span>{new Date(agr.effectiveDate).toLocaleDateString()} - {agr.expirationDate ? new Date(agr.expirationDate).toLocaleDateString() : "Open"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TEMPLATES TAB */}
        {/* ============================================================ */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">System and custom agreement templates</p>
            <Button variant="outline" className="border-slate-600 rounded-lg" onClick={() => navigate("/agreement-builder")}>
              <Plus className="w-4 h-4 mr-2" />Create Template
            </Button>
          </div>

          {templatesQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : templatesList.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <FileSignature className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No templates yet</h3>
                <p className="text-sm text-slate-500 mt-1">Templates will be populated as agreements are created</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesList.map((tmpl: any) => {
                const typeConfig = AGREEMENT_TYPES.find(t => t.value === tmpl.agreementType);
                const TypeIcon = typeConfig?.icon || FileText;
                return (
                  <Card
                    key={tmpl.id}
                    className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                          <TypeIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{tmpl.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {tmpl.agreementType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </p>
                          {tmpl.description && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{tmpl.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <Badge className="bg-slate-700/50 text-slate-400 border-0 text-xs">
                          v{tmpl.version || "1.0"}
                        </Badge>
                        <span className="text-xs text-slate-500">Used {tmpl.usageCount || 0}x</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* LANE CONTRACTS TAB */}
        {/* ============================================================ */}
        <TabsContent value="lanes" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={MapPin} label="Total Lanes" value={laneStatsQuery.data?.total || 0} color="bg-blue-500/20 text-blue-400" loading={laneStatsQuery.isLoading} />
            <StatCard icon={CheckCircle} label="Active" value={laneStatsQuery.data?.active || 0} color="bg-green-500/20 text-green-400" loading={laneStatsQuery.isLoading} />
            <StatCard icon={Clock} label="Expired" value={laneStatsQuery.data?.expired || 0} color="bg-red-500/20 text-red-400" loading={laneStatsQuery.isLoading} />
            <StatCard icon={DollarSign} label="Revenue" value={laneStatsQuery.data?.totalRevenue || 0} color="bg-emerald-500/20 text-emerald-400" loading={laneStatsQuery.isLoading} />
          </div>

          {lanesQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : lanesList.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No lane contracts</h3>
                <p className="text-sm text-slate-500 mt-1">Lane contracts are created from agreements with lane commitments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lanesList.map((lane: any) => (
                <Card key={lane.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
                          <MapPin className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {lane.originCity}, {lane.originState}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-white text-sm">
                              {lane.destinationCity}, {lane.destinationState}
                            </span>
                            {getStatusBadge(lane.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="text-green-400 font-medium">
                              ${parseFloat(lane.contractedRate).toLocaleString()} {lane.rateType}
                            </span>
                            {lane.volumeCommitment && (
                              <>
                                <span className="text-slate-600">|</span>
                                <span>{lane.volumeFulfilled || 0}/{lane.volumeCommitment} loads {lane.volumePeriod}</span>
                              </>
                            )}
                            {lane.estimatedMiles && (
                              <>
                                <span className="text-slate-600">|</span>
                                <span>{parseFloat(lane.estimatedMiles).toLocaleString()} mi</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>{lane.totalLoadsBooked || 0} loads</p>
                        <p className="text-green-400">${parseFloat(lane.totalRevenue || "0").toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* EXPIRING TAB */}
        {/* ============================================================ */}
        <TabsContent value="expiring" className="space-y-4 mt-4">
          {expiringQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : expiringList.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">All clear</h3>
                <p className="text-sm text-slate-500 mt-1">No agreements expiring in the next 90 days</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expiringList.map((agr: any) => {
                const daysLeft = agr.expirationDate
                  ? Math.ceil((new Date(agr.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;
                return (
                  <Card
                    key={agr.id}
                    className={cn(
                      "bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer",
                      daysLeft <= 14 && "border-red-500/30",
                      daysLeft > 14 && daysLeft <= 30 && "border-orange-500/30"
                    )}
                    onClick={() => navigate(`/agreement/${agr.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2.5 rounded-full",
                            daysLeft <= 14 ? "bg-red-500/20" : daysLeft <= 30 ? "bg-orange-500/20" : "bg-yellow-500/20"
                          )}>
                            <AlertTriangle className={cn(
                              "w-5 h-5",
                              daysLeft <= 14 ? "text-red-400" : daysLeft <= 30 ? "text-orange-400" : "text-yellow-400"
                            )} />
                          </div>
                          <div>
                            <span className="font-semibold text-white">{agr.agreementNumber}</span>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Expires {new Date(agr.expirationDate).toLocaleDateString()} ({daysLeft} days)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {agr.autoRenew ? (
                            <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                              <RefreshCw className="w-3 h-3 mr-1" />Auto-Renew
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="border-slate-600 rounded-lg text-xs h-7">
                              Renew
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
