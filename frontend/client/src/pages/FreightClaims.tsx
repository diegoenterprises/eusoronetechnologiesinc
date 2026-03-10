/**
 * FREIGHT CLAIMS MANAGEMENT CENTER
 * Comprehensive freight claims, disputes, freight audit, overcharge recovery,
 * loss prevention, shortage claims, and claims analytics.
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  Shield,
  CheckCircle,
  Search,
  Plus,
  Loader2,
  BarChart3,
  Scale,
  TrendingDown,
  TrendingUp,
  FileWarning,
  Gavel,
  ClipboardCheck,
  ShieldAlert,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ClaimType = "damage" | "loss" | "shortage" | "delay" | "contamination";
function getTypeColor(type: string): string {
  switch (type) {
    case "damage":
    case "property_damage":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "loss":
      return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    case "shortage":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    case "delay":
    case "near_miss":
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "contamination":
    case "hazmat_spill":
      return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/40";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "filed":
    case "reported":
      return "bg-blue-500/20 text-blue-400";
    case "under_review":
    case "investigating":
      return "bg-yellow-500/20 text-yellow-400";
    case "approved":
    case "resolved":
      return "bg-green-500/20 text-green-400";
    case "denied":
      return "bg-red-500/20 text-red-400";
    case "settled":
    case "paid":
      return "bg-emerald-500/20 text-emerald-400";
    case "closed":
      return "bg-slate-500/20 text-slate-400";
    case "appealed":
      return "bg-orange-500/20 text-orange-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "text-white",
  bgColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; direction: "up" | "down" | "stable" };
  color?: string;
  bgColor?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const defaultBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50";
  return (
    <Card className={cn(defaultBg, bgColor)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider mb-1`}>
              {title}
            </p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.direction === "up" ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : trend.direction === "down" ? (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ) : null}
                <span
                  className={cn(
                    "text-xs",
                    trend.direction === "up"
                      ? "text-green-400"
                      : trend.direction === "down"
                        ? "text-red-400"
                        : isLight ? "text-slate-500" : "text-slate-400",
                  )}
                >
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${isLight ? "bg-slate-100" : "bg-slate-700/30"}`}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Tab
// ---------------------------------------------------------------------------

function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashboardQuery = (trpc as any).freightClaims.getClaimsDashboard.useQuery();
  const analyticsQuery = (trpc as any).freightClaims.getClaimsAnalytics.useQuery({
    period: "year",
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`h-28 ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`} />
          ))}
        </div>
        <Skeleton className={`h-64 ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`} />
      </div>
    );
  }

  const dash = dashboardQuery.data;
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Open Claims"
          value={dash?.open ?? 0}
          icon={FileWarning}
          color="text-orange-400"
          trend={{ value: "Active", direction: "stable" }}
        />
        <KpiCard
          title="Total Claim Value"
          value={formatCurrency(dash?.totalValue ?? 0)}
          icon={DollarSign}
          color="text-red-400"
        />
        <KpiCard
          title="Avg Resolution"
          value={`${dash?.avgResolutionDays ?? 0} days`}
          icon={Clock}
          color="text-yellow-400"
        />
        <KpiCard
          title="Resolved"
          value={dash?.resolved ?? 0}
          icon={CheckCircle}
          color="text-green-400"
          trend={{ value: "Settled", direction: "up" }}
        />
      </div>

      {/* Aging & Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Buckets */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <Clock className="w-4 h-4 text-yellow-400" />
              Claim Aging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Under 30 days", value: dash?.aging?.under30 ?? 0, color: "bg-green-500" },
              { label: "30-60 days", value: dash?.aging?.days30to60 ?? 0, color: "bg-yellow-500" },
              { label: "60-90 days", value: dash?.aging?.days60to90 ?? 0, color: "bg-orange-500" },
              { label: "Over 90 days", value: dash?.aging?.over90 ?? 0, color: "bg-red-500" },
            ].map((bucket) => {
              const total =
                (dash?.aging?.under30 ?? 0) +
                (dash?.aging?.days30to60 ?? 0) +
                (dash?.aging?.days60to90 ?? 0) +
                (dash?.aging?.over90 ?? 0);
              const pct = total > 0 ? (bucket.value / total) * 100 : 0;
              return (
                <div key={bucket.label} className="flex items-center gap-3">
                  <span className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} w-28`}>{bucket.label}</span>
                  <div className={`flex-1 ${isLight ? "bg-slate-200" : "bg-slate-700/40"} rounded-full h-2`}>
                    <div
                      className={cn("h-2 rounded-full", bucket.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"} w-8 text-right`}>
                    {bucket.value}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Claims by Type */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Claims by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analytics?.byType ?? []).map(
              (item: { type: string; count: number; value: number }) => (
                <div
                  key={item.type}
                  className={`flex items-center justify-between p-2 rounded-lg ${isLight ? "bg-slate-50" : "bg-slate-800/40"}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs capitalize", getTypeColor(item.type))}>
                      {item.type}
                    </Badge>
                    <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{item.count} claims</span>
                  </div>
                  <span className={`text-sm font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ),
            )}
            {(!analytics?.byType || analytics.byType.length === 0) && (
              <p className={`text-sm ${isLight ? "text-slate-400" : "text-slate-500"} text-center py-4`}>No claims data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
        <CardHeader>
          <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"}`}>Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {(dash?.recentClaims ?? []).length === 0 ? (
            <p className={`text-sm ${isLight ? "text-slate-400" : "text-slate-500"} text-center py-6`}>No recent claims</p>
          ) : (
            <div className="space-y-2">
              {(dash?.recentClaims ?? []).map(
                (claim: {
                  id: string;
                  claimNumber: string;
                  type: string;
                  status: string;
                  description: string;
                  filedDate: string;
                }) => (
                  <div
                    key={claim.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-slate-50 hover:bg-slate-100" : "bg-slate-800/40 hover:bg-slate-800/60"} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                        {claim.claimNumber}
                      </span>
                      <Badge className={cn("text-xs", getTypeColor(claim.type))}>
                        {claim.type}
                      </Badge>
                      <Badge className={cn("text-xs", getStatusColor(claim.status))}>
                        {claim.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500">{claim.filedDate}</span>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Claims List Tab
// ---------------------------------------------------------------------------

function ClaimsListTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const claimsQuery = (trpc as any).freightClaims.getClaims.useQuery({
    search: search || undefined,
    limit: 50,
    offset: 0,
  });

  const claims = claimsQuery.data?.claims ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-9 ${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={`w-[180px] ${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className={isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="filed">Filed</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className={isLight ? "border-slate-200 text-slate-500" : "border-slate-700 text-slate-400"}
          onClick={() => claimsQuery.refetch()}
        >
          <RefreshCw className={cn("w-4 h-4", claimsQuery.isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Claims Table */}
      {claimsQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={`h-16 ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`} />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>No claims found</p>
            <p className="text-sm text-slate-500 mt-1">
              File a new claim to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {claims
            .filter(
              (c: any) => statusFilter === "all" || c.status === statusFilter,
            )
            .map(
              (claim: {
                id: string;
                claimNumber: string;
                type: string;
                status: string;
                description: string;
                amount: number;
                filedDate: string;
                severity: string;
                loadNumber: string;
              }) => (
                <Card
                  key={claim.id}
                  className={`${isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-900/60 border-slate-700/50 hover:border-slate-600/70"} transition-colors cursor-pointer`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-mono font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                              {claim.claimNumber}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs capitalize",
                                getTypeColor(claim.type),
                              )}
                            >
                              {claim.type}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusColor(claim.status),
                              )}
                            >
                              {claim.status}
                            </Badge>
                          </div>
                          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} truncate max-w-md`}>
                            {claim.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {claim.amount > 0 && (
                          <p className="text-sm font-medium text-red-400">
                            {formatCurrency(claim.amount)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">{claim.filedDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File Claim Tab
// ---------------------------------------------------------------------------

function FileClaimTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [formData, setFormData] = useState({
    loadId: "",
    type: "" as ClaimType | "",
    amount: "",
    description: "",
    commodity: "",
    damageExtent: "",
    discoveredAt: "",
  });

  const templatesQuery = (trpc as any).freightClaims.getClaimTemplates.useQuery();
  const fileClaimMutation = (trpc as any).freightClaims.fileClaim.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Claim ${data.claimNumber} filed successfully`);
      setFormData({
        loadId: "",
        type: "",
        amount: "",
        description: "",
        commodity: "",
        damageExtent: "",
        discoveredAt: "",
      });
    },
    onError: (error: any) =>
      toast.error("Failed to file claim", { description: error.message }),
  });

  const templates = templatesQuery.data?.templates ?? [];
  const selectedTemplate = templates.find(
    (t: any) => t.type === formData.type,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loadId || !formData.type || !formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    fileClaimMutation.mutate({
      loadId: formData.loadId,
      type: formData.type as ClaimType,
      amount: parseFloat(formData.amount),
      description: formData.description,
      commodity: formData.commodity || undefined,
      damageExtent: formData.damageExtent || undefined,
      discoveredAt: formData.discoveredAt || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
        <CardHeader>
          <CardTitle className={`text-lg ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
            <Plus className="w-5 h-5 text-orange-400" />
            File New Freight Claim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Claim Type */}
            <div className="space-y-2">
              <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Claim Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as ClaimType })}
              >
                <SelectTrigger className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}>
                  <SelectValue placeholder="Select claim type" />
                </SelectTrigger>
                <SelectContent className={isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}>
                  <SelectItem value="damage">Cargo Damage</SelectItem>
                  <SelectItem value="loss">Cargo Loss</SelectItem>
                  <SelectItem value="shortage">Shortage</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="contamination">Contamination</SelectItem>
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Load ID & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Load ID / Reference *</Label>
                <Input
                  placeholder="e.g. LD-2026-00123"
                  value={formData.loadId}
                  onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Claim Amount ($) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
            </div>

            {/* Commodity & Damage Extent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Commodity</Label>
                <Input
                  placeholder="e.g. Electronics, Produce"
                  value={formData.commodity}
                  onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Date Discovered</Label>
                <Input
                  type="date"
                  value={formData.discoveredAt}
                  onChange={(e) =>
                    setFormData({ ...formData, discoveredAt: e.target.value })
                  }
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
            </div>

            {/* Damage extent (conditional) */}
            {(formData.type === "damage" || formData.type === "contamination") && (
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Damage Extent</Label>
                <Select
                  value={formData.damageExtent}
                  onValueChange={(v) => setFormData({ ...formData, damageExtent: v })}
                >
                  <SelectTrigger className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}>
                    <SelectValue placeholder="Select extent" />
                  </SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}>
                    <SelectItem value="minor">Minor - Cosmetic only</SelectItem>
                    <SelectItem value="moderate">Moderate - Partial damage</SelectItem>
                    <SelectItem value="severe">Severe - Major damage</SelectItem>
                    <SelectItem value="total">Total Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Description *</Label>
              <Textarea
                placeholder="Describe the claim in detail: what happened, when, where, and the extent of damage/loss..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"} min-h-[120px]`}
              />
            </div>

            {/* Required fields hint */}
            {selectedTemplate && (
              <div className={`p-3 rounded-lg ${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-800/40 border border-slate-700/50"}`}>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mb-2`}>
                  Required evidence for {selectedTemplate.name}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.requiredFields.map((f: string) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="text-xs border-orange-500/40 text-orange-400"
                    >
                      {f.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className={isLight ? "border-slate-200 text-slate-700" : "border-slate-700 text-slate-300"}
                onClick={() =>
                  setFormData({
                    loadId: "",
                    type: "",
                    amount: "",
                    description: "",
                    commodity: "",
                    damageExtent: "",
                    discoveredAt: "",
                  })
                }
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={fileClaimMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {fileClaimMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                File Claim
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disputes Tab
// ---------------------------------------------------------------------------

function DisputesTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const disputesQuery = (trpc as any).freightClaims.getDisputeResolution.useQuery({
    limit: 20,
    offset: 0,
  });

  const [showFileForm, setShowFileForm] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    type: "",
    invoiceNumber: "",
    amount: "",
    description: "",
  });

  const fileDisputeMutation = (trpc as any).freightClaims.fileDispute.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Dispute ${data.disputeNumber} filed`);
      setShowFileForm(false);
      setDisputeForm({ type: "", invoiceNumber: "", amount: "", description: "" });
      disputesQuery.refetch();
    },
    onError: (error: any) =>
      toast.error("Failed to file dispute", { description: error.message }),
  });

  const summary = disputesQuery.data?.summary;
  const disputes = disputesQuery.data?.disputes ?? [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Active Disputes"
          value={summary?.active ?? 0}
          icon={Gavel}
          color="text-orange-400"
        />
        <KpiCard
          title="Resolved"
          value={summary?.resolved ?? 0}
          icon={CheckCircle}
          color="text-green-400"
        />
        <KpiCard
          title="Total Disputed"
          value={formatCurrency(summary?.totalDisputed ?? 0)}
          icon={DollarSign}
          color="text-red-400"
        />
        <KpiCard
          title="Total Recovered"
          value={formatCurrency(summary?.totalRecovered ?? 0)}
          icon={TrendingUp}
          color="text-emerald-400"
        />
      </div>

      {/* File Dispute */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowFileForm(!showFileForm)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          File Dispute
        </Button>
      </div>

      {showFileForm && (
        <Card className={isLight ? "bg-white border-orange-200" : "bg-slate-900/60 border-orange-500/30"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"}`}>File New Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Dispute Type</Label>
                <Select
                  value={disputeForm.type}
                  onValueChange={(v) => setDisputeForm({ ...disputeForm, type: v })}
                >
                  <SelectTrigger className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className={isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}>
                    <SelectItem value="rate">Rate Dispute</SelectItem>
                    <SelectItem value="accessorial">Accessorial</SelectItem>
                    <SelectItem value="detention">Detention</SelectItem>
                    <SelectItem value="lumper">Lumper</SelectItem>
                    <SelectItem value="fuel_surcharge">Fuel Surcharge</SelectItem>
                    <SelectItem value="duplicate_billing">Duplicate Billing</SelectItem>
                    <SelectItem value="service_failure">Service Failure</SelectItem>
                    <SelectItem value="contract_violation">Contract Violation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Invoice Number</Label>
                <Input
                  placeholder="INV-..."
                  value={disputeForm.invoiceNumber}
                  onChange={(e) =>
                    setDisputeForm({ ...disputeForm, invoiceNumber: e.target.value })
                  }
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
              <div className="space-y-2">
                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={disputeForm.amount}
                  onChange={(e) =>
                    setDisputeForm({ ...disputeForm, amount: e.target.value })
                  }
                  className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
                />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Description</Label>
              <Textarea
                placeholder="Describe the dispute..."
                value={disputeForm.description}
                onChange={(e) =>
                  setDisputeForm({ ...disputeForm, description: e.target.value })
                }
                className={`${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className={isLight ? "border-slate-200 text-slate-700" : "border-slate-700 text-slate-300"}
                onClick={() => setShowFileForm(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={fileDisputeMutation.isPending}
                onClick={() => {
                  if (
                    !disputeForm.type ||
                    !disputeForm.invoiceNumber ||
                    !disputeForm.amount ||
                    !disputeForm.description
                  ) {
                    toast.error("All fields are required");
                    return;
                  }
                  fileDisputeMutation.mutate({
                    type: disputeForm.type,
                    invoiceNumber: disputeForm.invoiceNumber,
                    amount: parseFloat(disputeForm.amount),
                    description: disputeForm.description,
                  });
                }}
              >
                {fileDisputeMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Submit Dispute
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardContent className="py-12 text-center">
            <Gavel className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>No disputes filed</p>
            <p className="text-sm text-slate-500 mt-1">
              File a dispute to challenge billing discrepancies
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {disputes.map(
            (d: {
              id: string;
              disputeNumber: string;
              type: string;
              status: string;
              amount: number;
              filedDate: string;
              description: string;
              invoiceNumber: string;
            }) => (
              <Card
                key={d.id}
                className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                        {d.disputeNumber}
                      </span>
                      <Badge className="text-xs capitalize bg-orange-500/20 text-orange-400">
                        {d.type.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={cn("text-xs", getStatusColor(d.status))}>
                        {d.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-red-400">
                      {formatCurrency(d.amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Freight Audit Tab
// ---------------------------------------------------------------------------

function FreightAuditTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const auditQuery = (trpc as any).freightClaims.getFreightAudit.useQuery({
    limit: 20,
    offset: 0,
  });
  const overchargeQuery = (trpc as any).freightClaims.getOverchargeRecovery.useQuery({
    limit: 20,
    offset: 0,
  });

  const runAuditMutation = (trpc as any).freightClaims.runFreightAudit.useMutation({
    onSuccess: () => {
      toast.success("Freight audit started");
      auditQuery.refetch();
    },
    onError: (error: any) =>
      toast.error("Failed to start audit", { description: error.message }),
  });

  const auditSummary = auditQuery.data?.summary;
  const overchargeSummary = overchargeQuery.data?.summary;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Invoices Audited"
          value={auditSummary?.totalAudited ?? 0}
          icon={ClipboardCheck}
          color="text-blue-400"
        />
        <KpiCard
          title="Total Variance"
          value={formatCurrency(auditSummary?.totalVariance ?? 0)}
          icon={AlertTriangle}
          color="text-yellow-400"
        />
        <KpiCard
          title="Overcharges Found"
          value={auditSummary?.overcharges ?? 0}
          icon={Receipt}
          color="text-red-400"
        />
        <KpiCard
          title="Recovered"
          value={formatCurrency(overchargeSummary?.totalRecovered ?? 0)}
          icon={TrendingUp}
          color="text-green-400"
        />
      </div>

      {/* Run Audit */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-sm font-medium ${isLight ? "text-slate-800" : "text-slate-200"}`}>Automated Freight Audit</h3>
          <p className="text-xs text-slate-500">
            Scan invoices for overcharges, duplicates, and rate errors
          </p>
        </div>
        <Button
          onClick={() => runAuditMutation.mutate({ auditType: "full" })}
          disabled={runAuditMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {runAuditMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Run Full Audit
        </Button>
      </div>

      {/* Audit Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
              Audit Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(auditQuery.data?.audits ?? []).length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No audit results yet. Run an audit to scan invoices.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(auditQuery.data?.audits ?? []).map((a: any) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg ${isLight ? "bg-slate-50" : "bg-slate-800/40"} flex justify-between`}
                  >
                    <div>
                      <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{a.invoiceNumber}</span>
                      <p className="text-xs text-slate-500">{a.carrier}</p>
                    </div>
                    <span className="text-sm font-medium text-red-400">
                      {formatCurrency(a.variance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <DollarSign className="w-4 h-4 text-green-400" />
              Overcharge Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(overchargeQuery.data?.recoveries ?? []).length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No overcharges identified yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(overchargeQuery.data?.recoveries ?? []).map((r: any) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg ${isLight ? "bg-slate-50" : "bg-slate-800/40"} flex justify-between`}
                  >
                    <div>
                      <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{r.invoiceNumber}</span>
                      <Badge className="ml-2 text-xs">{r.status}</Badge>
                    </div>
                    <span className="text-sm font-medium text-green-400">
                      +{formatCurrency(r.recoveredAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recovery Summary */}
      {overchargeSummary && overchargeSummary.totalIdentified > 0 && (
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className={isLight ? "text-sm text-slate-500" : "text-sm text-slate-400"}>Recovery Progress</p>
                <p className={`text-lg font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {formatCurrency(overchargeSummary.totalRecovered)} of{" "}
                  {formatCurrency(overchargeSummary.totalIdentified)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {Math.round(overchargeSummary.recoveryRate * 100)}%
                </p>
                <p className="text-xs text-slate-500">Recovery Rate</p>
              </div>
            </div>
            <div className={`mt-3 ${isLight ? "bg-slate-200" : "bg-slate-700/40"} rounded-full h-2`}>
              <div
                className="h-2 rounded-full bg-green-500"
                style={{
                  width: `${Math.min(100, overchargeSummary.recoveryRate * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loss Prevention Tab
// ---------------------------------------------------------------------------

function LossPreventionTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashQuery = (trpc as any).freightClaims.getLossPreventionDashboard.useQuery();
  const analysisQuery = (trpc as any).freightClaims.getLossPreventionAnalysis.useQuery({
    groupBy: "lane",
    period: "year",
  });

  if (dashQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-28 ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = dashQuery.data?.metrics;
  const recommendations = analysisQuery.data?.recommendations ?? [];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Losses"
          value={metrics?.totalLosses ?? 0}
          icon={ShieldAlert}
          color="text-red-400"
        />
        <KpiCard
          title="Loss Value"
          value={formatCurrency(metrics?.lossValue ?? 0)}
          icon={DollarSign}
          color="text-red-400"
        />
        <KpiCard
          title="Prevented Losses"
          value={metrics?.preventedLosses ?? 0}
          icon={Shield}
          color="text-green-400"
        />
        <KpiCard
          title="Prevention Savings"
          value={formatCurrency(metrics?.preventionSavings ?? 0)}
          icon={TrendingUp}
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Lanes */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Top Risk Lanes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(dashQuery.data?.topRiskLanes ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No risk lane data available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(dashQuery.data?.topRiskLanes ?? []).map((lane: any) => (
                  <div
                    key={lane.lane}
                    className={`p-3 rounded-lg ${isLight ? "bg-slate-50" : "bg-slate-800/40"} flex justify-between items-center`}
                  >
                    <div>
                      <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{lane.lane}</span>
                      <p className="text-xs text-slate-500">
                        {lane.lossCount} incidents
                      </p>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400">
                      Risk: {lane.riskScore}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"} flex items-center gap-2`}>
              <Shield className="w-4 h-4 text-green-400" />
              Prevention Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec: string, i: number) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${isLight ? "bg-slate-50" : "bg-slate-800/40"}`}
                >
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(dashQuery.data?.alerts ?? []).length > 0 && (
        <Card className={isLight ? "bg-white border-red-200" : "bg-slate-900/60 border-red-500/30"}>
          <CardHeader>
            <CardTitle className="text-base text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dashQuery.data?.alerts ?? []).map((alert: any) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-red-500/20 text-red-400 text-xs">
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-slate-500">{alert.createdAt}</span>
                </div>
                <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics Tab
// ---------------------------------------------------------------------------

function AnalyticsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("year");

  const analyticsQuery = (trpc as any).freightClaims.getClaimsAnalytics.useQuery({
    period,
  });

  if (analyticsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-28 ${isLight ? "bg-slate-100" : "bg-slate-800/50"}`} />
          ))}
        </div>
      </div>
    );
  }

  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className={`w-[140px] ${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800/50 border-slate-700 text-slate-200"}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total Claims"
          value={data?.frequency ?? 0}
          icon={FileText}
          color="text-blue-400"
        />
        <KpiCard
          title="Avg Claim Cost"
          value={formatCurrency(data?.avgCost ?? 0)}
          icon={DollarSign}
          color="text-orange-400"
        />
        <KpiCard
          title="Avg Resolution"
          value={`${data?.avgResolutionDays ?? 0} days`}
          icon={Clock}
          color="text-yellow-400"
        />
        <KpiCard
          title="Recovery Rate"
          value={`${Math.round((data?.recoveryRate ?? 0) * 100)}%`}
          icon={TrendingUp}
          color="text-green-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Type */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"}`}>Claims by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.byType ?? []).map(
              (item: { type: string; count: number; value: number }) => {
                const maxCount = Math.max(
                  ...(data?.byType ?? []).map((t: any) => t.count),
                  1,
                );
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"} capitalize`}>
                        {item.type}
                      </span>
                      <span className="text-sm text-slate-400">
                        {item.count} ({formatCurrency(item.value)})
                      </span>
                    </div>
                    <div className={`${isLight ? "bg-slate-200" : "bg-slate-700/40"} rounded-full h-2`}>
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          item.type === "damage"
                            ? "bg-red-500"
                            : item.type === "loss"
                              ? "bg-orange-500"
                              : item.type === "shortage"
                                ? "bg-yellow-500"
                                : item.type === "delay"
                                  ? "bg-blue-500"
                                  : "bg-purple-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
            {(!data?.byType || data.byType.length === 0) && (
              <p className={`text-sm ${isLight ? "text-slate-400" : "text-slate-500"} text-center py-4`}>
                No data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className={isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-700/50"}>
          <CardHeader>
            <CardTitle className={`text-base ${isLight ? "text-slate-800" : "text-slate-200"}`}>Claims by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.byStatus ?? []).map(
              (item: { status: string; count: number }) => {
                const maxCount = Math.max(
                  ...(data?.byStatus ?? []).map((s: any) => s.count),
                  1,
                );
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs capitalize",
                            getStatusColor(item.status),
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <span className={isLight ? "text-sm text-slate-500" : "text-sm text-slate-400"}>{item.count}</span>
                    </div>
                    <div className={`${isLight ? "bg-slate-200" : "bg-slate-700/40"} rounded-full h-2`}>
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          item.status === "open"
                            ? "bg-blue-500"
                            : item.status === "investigating"
                              ? "bg-yellow-500"
                              : item.status === "resolved"
                                ? "bg-green-500"
                                : "bg-red-500",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
            {(!data?.byStatus || data.byStatus.length === 0) && (
              <p className={`text-sm ${isLight ? "text-slate-400" : "text-slate-500"} text-center py-4`}>
                No data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FreightClaims() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className={`p-6 space-y-6 max-w-[1400px] mx-auto ${isLight ? "bg-slate-50 text-slate-900" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? "text-slate-900" : "text-slate-100"} flex items-center gap-2`}>
            <Scale className="w-7 h-7 text-orange-400" />
            Freight Claims Center
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>
            Claims, disputes, freight audit, and loss prevention management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/60 border border-slate-700/50"} p-1`}>
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <FileText className="w-4 h-4 mr-2" />
            Claims
          </TabsTrigger>
          <TabsTrigger
            value="file"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            File Claim
          </TabsTrigger>
          <TabsTrigger
            value="disputes"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Disputes
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Freight Audit
          </TabsTrigger>
          <TabsTrigger
            value="loss-prevention"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Loss Prevention
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-400"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="claims" className="mt-6">
          <ClaimsListTab />
        </TabsContent>
        <TabsContent value="file" className="mt-6">
          <FileClaimTab />
        </TabsContent>
        <TabsContent value="disputes" className="mt-6">
          <DisputesTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <FreightAuditTab />
        </TabsContent>
        <TabsContent value="loss-prevention" className="mt-6">
          <LossPreventionTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
