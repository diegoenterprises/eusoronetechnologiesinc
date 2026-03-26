/**
 * VENDOR & SUPPLIER MANAGEMENT PAGE
 * Comprehensive vendor management: dashboard, directory, scorecards,
 * PO management, RFQ, spend analytics. Dark theme with teal accents.
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building2, Star, DollarSign, TrendingUp, TrendingDown,
  ShieldCheck, FileText, Package, Search, Plus, Filter,
  ChevronRight, Clock, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, Users, Truck, Wrench, Fuel, Scale, Cpu,
  ClipboardList, ArrowUpDown, Eye, ThumbsUp, ThumbsDown,
  Send, Award, Receipt, CircleDollarSign, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Tab Config ─────────────────────────────────────────────────────────────

type TabId = "dashboard" | "directory" | "scorecards" | "purchase-orders" | "rfq" | "spend" | "compliance" | "onboarding";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "directory", label: "Directory", icon: <Building2 className="w-4 h-4" /> },
  { id: "scorecards", label: "Scorecards", icon: <Star className="w-4 h-4" /> },
  { id: "purchase-orders", label: "Purchase Orders", icon: <ClipboardList className="w-4 h-4" /> },
  { id: "rfq", label: "RFQ", icon: <Send className="w-4 h-4" /> },
  { id: "spend", label: "Spend Analytics", icon: <CircleDollarSign className="w-4 h-4" /> },
  { id: "compliance", label: "Compliance", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "onboarding", label: "Onboarding", icon: <Users className="w-4 h-4" /> },
];

// ─── Status Helpers ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  active: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  onboarding: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  compliant: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  expiring_soon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  expired: "bg-red-500/20 text-red-400 border-red-500/30",
  missing: "bg-red-500/20 text-red-400 border-red-500/30",
  draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  pending_approval: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  sent: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  received: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  open: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  awarded: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("text-xs border", STATUS_COLORS[status] || "bg-slate-500/20 text-slate-400")}>
      {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </Badge>
  );
}

function StatCard({ icon, label, value, sub, color = "teal", loading = false }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; loading?: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const colorMap: Record<string, string> = {
    teal: "bg-teal-500/20 text-teal-400",
    amber: "bg-amber-500/20 text-amber-400",
    red: "bg-red-500/20 text-red-400",
    sky: "bg-sky-500/20 text-sky-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/20 text-purple-400",
  };
  return (
    <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", colorMap[color] || colorMap.teal)}>
            {icon}
          </div>
          <div>
            {loading ? <Skeleton className="h-8 w-20" /> : (
              <p className="text-2xl font-bold text-teal-400">{value}</p>
            )}
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = pct >= 80 ? "bg-teal-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={isLight ? "text-slate-600" : "text-slate-300"}>{label}</span>
        <span className="text-teal-400 font-medium">{score}/{max}</span>
      </div>
      <div className={`h-2 ${isLight ? "bg-slate-200" : "bg-slate-700"} rounded-full overflow-hidden`}>
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`p-4 rounded-full ${isLight ? "bg-slate-100" : "bg-slate-800"} mb-4`}>{icon}</div>
      <h3 className={`text-lg font-semibold ${isLight ? "text-slate-700" : "text-slate-300"} mb-1`}>{title}</h3>
      <p className="text-sm text-slate-500 max-w-md">{description}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VendorSupplier() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Queries — cast via (trpc as any) per codebase pattern
  const dashboardQuery = (trpc as any).vendorSupplier.getVendorDashboard.useQuery(
    undefined,
    { enabled: activeTab === "dashboard" }
  );
  const vendorsQuery = (trpc as any).vendorSupplier.getVendors.useQuery(
    {
      search: searchTerm || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      page: 1,
      limit: 25,
    },
    { enabled: activeTab === "directory" }
  );
  const categoriesQuery = (trpc as any).vendorSupplier.getVendorCategories.useQuery(
    undefined,
    { enabled: activeTab === "directory" || activeTab === "dashboard" }
  );
  const posQuery = (trpc as any).vendorSupplier.getPurchaseOrders.useQuery(
    { search: searchTerm || undefined, page: 1, limit: 25 },
    { enabled: activeTab === "purchase-orders" }
  );
  const rfqsQuery = (trpc as any).vendorSupplier.getRfqManagement.useQuery(
    { search: searchTerm || undefined, page: 1, limit: 25 },
    { enabled: activeTab === "rfq" }
  );
  const spendQuery = (trpc as any).vendorSupplier.getSpendAnalytics.useQuery(
    { period: "quarter" },
    { enabled: activeTab === "spend" }
  );
  const scorecardQuery = (trpc as any).vendorSupplier.getVendorScorecard.useQuery(
    { vendorId: selectedVendorId, period: "quarter" },
    { enabled: activeTab === "scorecards" && !!selectedVendorId }
  );
  const complianceQuery = (trpc as any).vendorSupplier.getVendorCompliance.useQuery(
    { vendorId: selectedVendorId },
    { enabled: activeTab === "compliance" && !!selectedVendorId }
  );
  const onboardingQuery = (trpc as any).vendorSupplier.getVendorOnboarding.useQuery(
    { vendorId: selectedVendorId },
    { enabled: activeTab === "onboarding" && !!selectedVendorId }
  );
  const preferredQuery = (trpc as any).vendorSupplier.getPreferredVendorList.useQuery(
    {},
    { enabled: activeTab === "dashboard" }
  );
  const paymentsQuery = (trpc as any).vendorSupplier.getVendorPayments.useQuery(
    { page: 1, limit: 10 },
    { enabled: activeTab === "dashboard" }
  );

  const dashboard = dashboardQuery.data;
  const vendors = vendorsQuery.data?.vendors || [];
  const categories = categoriesQuery.data?.categories || [];
  const pos = posQuery.data?.orders || [];
  const poSummary = posQuery.data?.summary;
  const rfqs = rfqsQuery.data?.rfqs || [];
  const spend = spendQuery.data;
  const scorecard = scorecardQuery.data;
  const compliance = complianceQuery.data;
  const onboarding = onboardingQuery.data;
  const preferred = preferredQuery.data?.vendors || [];
  const payments = paymentsQuery.data?.payments || [];

  // ─── Render helpers ───────────────────────────────────────────────────────

  function renderDashboard() {
    const loading = dashboardQuery.isLoading;
    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="w-6 h-6" />} label="Total Vendors" value={dashboard?.totalVendors ?? 0} sub={`${dashboard?.activeVendors ?? 0} active`} loading={loading} />
          <StatCard icon={<DollarSign className="w-6 h-6" />} label="Spend MTD" value={`$${(dashboard?.totalSpendMTD ?? 0).toLocaleString()}`} sub={`$${(dashboard?.totalSpendYTD ?? 0).toLocaleString()} YTD`} color="emerald" loading={loading} />
          <StatCard icon={<ShieldCheck className="w-6 h-6" />} label="Compliance Rate" value={`${dashboard?.complianceRate ?? 0}%`} color={dashboard?.complianceRate && dashboard.complianceRate < 90 ? "amber" : "teal"} loading={loading} />
          <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Active POs" value={dashboard?.activePOs ?? 0} sub={`${dashboard?.pendingApprovals ?? 0} pending`} color="sky" loading={loading} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={<Send className="w-6 h-6" />} label="Open RFQs" value={dashboard?.openRfqs ?? 0} color="purple" loading={loading} />
          <StatCard icon={<Star className="w-6 h-6" />} label="Avg Vendor Rating" value={`${(dashboard?.avgVendorRating ?? 0).toFixed(1)}/5`} color="amber" loading={loading} />
          <StatCard icon={<Award className="w-6 h-6" />} label="Preferred Vendors" value={preferred.length} color="teal" loading={loading} />
        </div>

        {/* Spend by Category + Top Vendors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-teal-400 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Spend by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />) : (
                dashboard?.spendByCategory?.length > 0 ? dashboard.spendByCategory.map((cat: any) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`${isLight ? "text-slate-600" : "text-slate-300"} capitalize`}>{cat.category}</span>
                      <span className="text-teal-400">${cat.amount.toLocaleString()} ({cat.percentage}%)</span>
                    </div>
                    <Progress value={cat.percentage} className={`h-2 ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4 text-center">No spend data yet</p>
                )
              )}
            </CardContent>
          </Card>

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-teal-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Top Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />) : (
                dashboard?.topVendors?.length > 0 ? dashboard.topVendors.map((v: any, i: number) => (
                  <div key={v.id} className={`flex items-center justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-5">#{i + 1}</span>
                      <div>
                        <p className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`}>{v.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{v.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-teal-400">${v.totalSpend.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4 text-center">No vendor data yet</p>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compliance Alerts + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-24 w-full" /> : (
                dashboard?.complianceAlerts?.length > 0 ? dashboard.complianceAlerts.map((alert: any) => (
                  <div key={alert.vendorId + alert.issue} className={`flex items-start gap-3 py-2 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                    <AlertTriangle className={cn("w-4 h-4 mt-0.5", alert.severity === "high" ? "text-red-400" : "text-amber-400")} />
                    <div>
                      <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{alert.vendorName}</p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{alert.issue}</p>
                      <p className="text-xs text-slate-500">Due: {alert.dueDate}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4 text-center">No compliance alerts</p>
                )
              )}
            </CardContent>
          </Card>

          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-sky-400 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-24 w-full" /> : (
                dashboard?.recentActivity?.length > 0 ? dashboard.recentActivity.map((a: any) => (
                  <div key={a.id} className={`flex items-start gap-3 py-2 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                    <div className={`p-1 rounded ${isLight ? "bg-slate-100" : "bg-slate-700"} mt-0.5`}>
                      <FileText className="w-3 h-3 text-slate-400" />
                    </div>
                    <div>
                      <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{a.description}</p>
                      <p className="text-xs text-slate-500">{a.vendorName} - {a.timestamp}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4 text-center">No recent activity</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderDirectory() {
    return (
      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search vendors..."
              className={`pl-10 ${isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-800/50 border-slate-700/50 text-slate-200"}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={`${isLight ? "bg-white border border-slate-300" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg px-3 py-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            className={`${isLight ? "bg-white border border-slate-300" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg px-3 py-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="onboarding">Onboarding</option>
          </select>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Vendor
          </Button>
        </div>

        {/* Vendor List */}
        {vendorsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No Vendors Found"
            description="Add your first vendor to start managing your supplier relationships."
            icon={<Building2 className="w-8 h-8 text-slate-500" />}
          />
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor: any) => (
              <Card key={vendor.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-teal-500/30 transition-colors cursor-pointer`}
                onClick={() => { setSelectedVendorId(vendor.id); setActiveTab("scorecards"); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-teal-500/10">
                        <Building2 className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}>{vendor.name}</p>
                          {vendor.isPreferred && <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">Preferred</Badge>}
                        </div>
                        <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"} capitalize`}>{vendor.category} - {vendor.city}, {vendor.state}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{vendor.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-slate-500">|</span>
                          <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{vendor.activePos} active POs</span>
                          {vendor.tags?.length > 0 && vendor.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className={`text-xs ${isLight ? "border-slate-300 text-slate-500" : "border-slate-600 text-slate-400"}`}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <StatusBadge status={vendor.status} />
                        <p className="text-sm text-teal-400 font-medium mt-1">${vendor.totalSpend.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Compliance: {vendor.complianceScore}%</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderScorecards() {
    if (!selectedVendorId) {
      return (
        <EmptyState
          title="Select a Vendor"
          description="Choose a vendor from the directory to view their performance scorecard."
          icon={<Star className="w-8 h-8 text-slate-500" />}
        />
      );
    }
    const sc = scorecard;
    const loading = scorecardQuery.isLoading;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-teal-400">{sc?.vendorName || "Vendor Scorecard"}</h2>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Performance evaluation - {sc?.period || "Quarter"}</p>
          </div>
          <Button variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"} onClick={() => { setSelectedVendorId(""); setActiveTab("directory"); }}>
            Back to Directory
          </Button>
        </div>

        {/* Overall Score */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-6 text-center">
            {loading ? <Skeleton className="h-20 w-20 rounded-full mx-auto" /> : (
              <>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-teal-500/50 bg-teal-500/10 mb-3">
                  <span className="text-3xl font-bold text-teal-400">{sc?.overallScore ?? 0}</span>
                </div>
                <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Overall Performance Score</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Score Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Quality", data: sc?.quality, icon: <CheckCircle2 className="w-5 h-5 text-teal-400" />, metrics: [
              { l: "Defect Rate", v: `${sc?.quality?.defectRate ?? 0}%` },
              { l: "Return Rate", v: `${sc?.quality?.returnRate ?? 0}%` },
              { l: "Incidents", v: sc?.quality?.incidents ?? 0 },
            ]},
            { label: "Delivery", data: sc?.delivery, icon: <Truck className="w-5 h-5 text-sky-400" />, metrics: [
              { l: "On-Time Rate", v: `${sc?.delivery?.onTimeRate ?? 0}%` },
              { l: "Avg Lead Time", v: `${sc?.delivery?.avgLeadTimeDays ?? 0}d` },
              { l: "Late Deliveries", v: sc?.delivery?.lateDeliveries ?? 0 },
            ]},
            { label: "Price", data: sc?.price, icon: <DollarSign className="w-5 h-5 text-emerald-400" />, metrics: [
              { l: "Competitiveness", v: `${sc?.price?.competitiveness ?? 0}%` },
              { l: "Price Variance", v: `${sc?.price?.priceVariance ?? 0}%` },
              { l: "Cost Savings", v: `$${(sc?.price?.costSavings ?? 0).toLocaleString()}` },
            ]},
            { label: "Responsiveness", data: sc?.responsiveness, icon: <Clock className="w-5 h-5 text-amber-400" />, metrics: [
              { l: "Avg Response", v: `${sc?.responsiveness?.avgResponseTimeHrs ?? 0}h` },
              { l: "Resolution", v: `${sc?.responsiveness?.issueResolutionDays ?? 0}d` },
              { l: "Communication", v: `${sc?.responsiveness?.communicationRating ?? 0}/5` },
            ]},
          ].map((dim) => (
            <Card key={dim.label} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-base flex items-center gap-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                  {dim.icon} {dim.label}
                  <span className="ml-auto text-teal-400 font-bold">{dim.data?.score ?? 0}/100</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? <Skeleton className="h-16 w-full" /> : (
                  <>
                    <ScoreBar label={dim.label} score={dim.data?.score ?? 0} />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {dim.metrics.map(m => (
                        <div key={m.l} className="text-center">
                          <p className="text-xs text-slate-500">{m.l}</p>
                          <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>Trend:</span>
                      {dim.data?.trend === "up" ? <TrendingUp className="w-3 h-3 text-teal-400" /> :
                       dim.data?.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                       <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      <span className="capitalize">{dim.data?.trend ?? "stable"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderPurchaseOrders() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search POs..."
              className={`pl-10 ${isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-800/50 border-slate-700/50 text-slate-200"}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New PO
          </Button>
        </div>

        {/* PO Summary */}
        {poSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg p-3 text-center`}>
              <p className="text-lg font-bold text-teal-400">${(poSummary.totalValue ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Value</p>
            </div>
            <div className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg p-3 text-center`}>
              <p className={`text-lg font-bold ${isLight ? "text-slate-500" : "text-slate-400"}`}>{poSummary.draftCount ?? 0}</p>
              <p className="text-xs text-slate-500">Drafts</p>
            </div>
            <div className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg p-3 text-center`}>
              <p className="text-lg font-bold text-amber-400">{poSummary.pendingCount ?? 0}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg p-3 text-center`}>
              <p className="text-lg font-bold text-teal-400">{poSummary.approvedCount ?? 0}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
            <div className={`${isLight ? "bg-white border border-slate-200" : "bg-slate-800/50 border border-slate-700/50"} rounded-lg p-3 text-center`}>
              <p className="text-lg font-bold text-green-400">{poSummary.receivedCount ?? 0}</p>
              <p className="text-xs text-slate-500">Received</p>
            </div>
          </div>
        )}

        {/* PO List */}
        {posQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : pos.length === 0 ? (
          <EmptyState
            title="No Purchase Orders"
            description="Create your first purchase order to start tracking vendor procurement."
            icon={<ClipboardList className="w-8 h-8 text-slate-500" />}
          />
        ) : (
          <div className="space-y-2">
            {pos.map((po: any) => (
              <Card key={po.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-teal-500/30 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-teal-500/10">
                        <Receipt className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}>{po.poNumber}</p>
                        <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{po.vendorName}</p>
                        <p className="text-xs text-slate-500">{po.itemCount} items - {po.createdAt}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-lg font-bold text-teal-400">${po.total.toLocaleString()}</p>
                        <StatusBadge status={po.status} />
                      </div>
                      {po.status === "pending_approval" && (
                        <div className="flex gap-1">
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderRfq() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search RFQs..."
              className={`pl-10 ${isLight ? "bg-white border-slate-300 text-slate-700" : "bg-slate-800/50 border-slate-700/50 text-slate-200"}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New RFQ
          </Button>
        </div>

        {rfqsQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : rfqs.length === 0 ? (
          <EmptyState
            title="No RFQs"
            description="Create a Request for Quote to collect competitive bids from vendors."
            icon={<Send className="w-8 h-8 text-slate-500" />}
          />
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq: any) => (
              <Card key={rfq.id} className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-teal-500/30 transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-200"}`}>{rfq.rfqNumber}</p>
                        <StatusBadge status={rfq.status} />
                      </div>
                      <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"} mt-1`}>{rfq.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-500 capitalize">{rfq.category}</span>
                        <span className="text-xs text-slate-500">Deadline: {rfq.deadline}</span>
                        <span className="text-xs text-slate-500">{rfq.quotesReceived}/{rfq.invitedVendors} quotes</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-400">${(rfq.estimatedValue ?? 0).toLocaleString()}</p>
                      {rfq.awardedVendorName && (
                        <p className="text-xs text-emerald-400">Awarded: {rfq.awardedVendorName}</p>
                      )}
                      <Button size="sm" variant="ghost" className="text-teal-400 hover:text-teal-300 mt-1">
                        <Eye className="w-3 h-3 mr-1" /> Compare
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderSpendAnalytics() {
    const loading = spendQuery.isLoading;
    return (
      <div className="space-y-6">
        {/* Top-line Spend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Spend"
            value={`$${(spend?.totalSpend ?? 0).toLocaleString()}`}
            color="teal"
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Previous Period"
            value={`$${(spend?.previousPeriodSpend ?? 0).toLocaleString()}`}
            color="sky"
            loading={loading}
          />
          <StatCard
            icon={spend?.changePercent >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            label="Change"
            value={`${(spend?.changePercent ?? 0) >= 0 ? "+" : ""}${spend?.changePercent ?? 0}%`}
            color={spend?.changePercent > 5 ? "red" : "emerald"}
            loading={loading}
          />
        </div>

        {/* By Category */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-400">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : (
              spend?.byCategory?.length > 0 ? (
                <div className="space-y-3">
                  {spend.byCategory.map((cat: any) => (
                    <div key={cat.category} className="flex items-center gap-4">
                      <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"} capitalize w-32 shrink-0`}>{cat.category}</span>
                      <div className="flex-1">
                        <div className={`h-6 ${isLight ? "bg-slate-200" : "bg-slate-700"} rounded-full overflow-hidden`}>
                          <div className="h-full bg-teal-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(cat.percentage, 5)}%` }}>
                            <span className="text-xs text-white font-medium">{cat.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-teal-400 font-medium w-28 text-right">${cat.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 w-20 text-right">{cat.vendorCount} vendors</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm py-4 text-center">No spend data available</p>
            )}
          </CardContent>
        </Card>

        {/* Spend by Vendor */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-400">Top Vendors by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              spend?.byVendor?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-slate-500 border-b ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                        <th className="text-left py-2 font-medium">Vendor</th>
                        <th className="text-right py-2 font-medium">Amount</th>
                        <th className="text-right py-2 font-medium">Share</th>
                        <th className="text-right py-2 font-medium">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spend.byVendor.map((v: any) => (
                        <tr key={v.vendorId} className={`border-b ${isLight ? "border-slate-200" : "border-slate-700/50"}`}>
                          <td className={`py-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>{v.vendorName}</td>
                          <td className="py-2 text-right text-teal-400 font-medium">${v.amount.toLocaleString()}</td>
                          <td className={`py-2 text-right ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.percentage}%</td>
                          <td className={`py-2 text-right ${isLight ? "text-slate-500" : "text-slate-400"}`}>{v.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-slate-500 text-sm py-4 text-center">No vendor spend data</p>
            )}
          </CardContent>
        </Card>

        {/* Savings Opportunities */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" /> Savings Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-20 w-full" /> : (
              spend?.savingsOpportunities?.length > 0 ? spend.savingsOpportunities.map((opp: any, i: number) => (
                <div key={i} className={`flex items-center justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                  <div>
                    <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{opp.description}</p>
                    <p className="text-xs text-slate-500 capitalize">{opp.category} - {opp.priority} priority</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Save ${opp.estimatedSavings.toLocaleString()}
                  </Badge>
                </div>
              )) : <p className="text-slate-500 text-sm py-4 text-center">No savings opportunities identified yet</p>
            )}
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-400">Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              spend?.budgetVsActual?.length > 0 ? (
                <div className="space-y-3">
                  {spend.budgetVsActual.map((bva: any) => (
                    <div key={bva.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isLight ? "text-slate-600" : "text-slate-300"} capitalize`}>{bva.category}</span>
                        <span className={cn("text-xs", bva.variance > 0 ? "text-red-400" : "text-teal-400")}>
                          {bva.variance > 0 ? "+" : ""}{bva.variance}% variance
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className={`flex-1 h-3 ${isLight ? "bg-slate-200" : "bg-slate-700"} rounded-full overflow-hidden relative`}>
                          <div className="absolute h-full bg-teal-500/30 rounded-full" style={{ width: `${Math.min((bva.budget / Math.max(bva.budget, bva.actual)) * 100, 100)}%` }} />
                          <div className={cn("absolute h-full rounded-full", bva.actual > bva.budget ? "bg-red-500/60" : "bg-teal-500/60")} style={{ width: `${Math.min((bva.actual / Math.max(bva.budget, bva.actual)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-32 text-right">${bva.actual.toLocaleString()} / ${bva.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm py-4 text-center">No budget data configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCompliance() {
    if (!selectedVendorId) {
      return (
        <EmptyState
          title="Select a Vendor"
          description="Choose a vendor from the directory to review their compliance status."
          icon={<ShieldCheck className="w-8 h-8 text-slate-500" />}
        />
      );
    }
    const loading = complianceQuery.isLoading;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-teal-400">{compliance?.vendorName || "Vendor Compliance"}</h2>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Compliance & documentation status</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={compliance?.overallStatus || "unknown"} />
            <Button variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"} onClick={() => { setSelectedVendorId(""); setActiveTab("directory"); }}>
              Back to Directory
            </Button>
          </div>
        </div>

        {/* Compliance Score */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-teal-500/50 bg-teal-500/10">
                <span className="text-2xl font-bold text-teal-400">{compliance?.complianceScore ?? 0}%</span>
              </div>
              <div className="flex-1">
                <ScoreBar label="Compliance Score" score={compliance?.complianceScore ?? 0} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Items */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-400">Compliance Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              compliance?.items?.length > 0 ? compliance.items.map((item: any) => (
                <div key={item.id} className={`flex items-center justify-between py-3 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                  <div className="flex items-center gap-3">
                    {item.status === "compliant" ? <CheckCircle2 className="w-5 h-5 text-teal-400" /> :
                     item.status === "expiring_soon" ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
                     <XCircle className="w-5 h-5 text-red-400" />}
                    <div>
                      <p className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`}>{item.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      {item.expirationDate && (
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Expires: {item.expirationDate}</p>
                      )}
                      {item.daysUntilExpiry !== null && (
                        <p className={cn("text-xs", item.daysUntilExpiry <= 30 ? "text-red-400" : item.daysUntilExpiry <= 60 ? "text-amber-400" : "text-slate-500")}>
                          {item.daysUntilExpiry} days remaining
                        </p>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              )) : <p className="text-slate-500 text-sm py-4 text-center">No compliance items tracked</p>
            )}
          </CardContent>
        </Card>

        {/* Missing Documents */}
        {compliance?.missingDocuments?.length > 0 && (
          <Card className="bg-red-900/20 border-red-500/30 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Missing Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {compliance.missingDocuments.map((doc: string) => (
                  <li key={doc} className="text-sm text-red-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {doc}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderOnboarding() {
    if (!selectedVendorId) {
      return (
        <EmptyState
          title="Select a Vendor"
          description="Choose a vendor from the directory to view their onboarding progress."
          icon={<Users className="w-8 h-8 text-slate-500" />}
        />
      );
    }
    const loading = onboardingQuery.isLoading;
    const steps = onboarding?.steps || [];
    const completedCount = steps.filter((s: any) => s.status === "completed").length;
    const pct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-teal-400">{onboarding?.vendorName || "Vendor Onboarding"}</h2>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Onboarding progress and requirements</p>
          </div>
          <Button variant="outline" className={isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"} onClick={() => { setSelectedVendorId(""); setActiveTab("directory"); }}>
            Back to Directory
          </Button>
        </div>

        {/* Progress */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>Overall Progress</span>
              <span className="text-sm font-medium text-teal-400">{pct}% ({completedCount}/{steps.length} steps)</span>
            </div>
            <Progress value={pct} className={`h-3 ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-400">Onboarding Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-0">
                {steps.map((step: any, i: number) => (
                  <div key={step.step} className="flex items-start gap-4 relative">
                    {/* Connector line */}
                    {i < steps.length - 1 && (
                      <div className={`absolute left-[18px] top-10 w-0.5 h-[calc(100%-10px)] ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                    )}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10",
                      step.status === "completed" ? "bg-teal-500" : step.status === "in_progress" ? "bg-amber-500" : "bg-slate-700"
                    )}>
                      {step.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                       step.status === "in_progress" ? <Clock className="w-5 h-5 text-white" /> :
                       <span className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{i + 1}</span>}
                    </div>
                    <div className="pb-6 flex-1">
                      <p className={cn("text-sm font-medium", step.status === "completed" ? "text-teal-400" : "text-slate-300")}>{step.label}</p>
                      {step.completedAt && <p className="text-xs text-slate-500">Completed: {step.completedAt}</p>}
                      {step.notes && <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"} mt-1`}>{step.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        {onboarding?.requirements?.length > 0 && (
          <Card className={`${isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-teal-400">Required Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {onboarding.requirements.map((req: any) => (
                <div key={req.id} className={`flex items-center justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"} last:border-0`}>
                  <div className="flex items-center gap-3">
                    {req.uploaded ? <CheckCircle2 className="w-4 h-4 text-teal-400" /> : <XCircle className="w-4 h-4 text-slate-500" />}
                    <div>
                      <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{req.name}</p>
                      <p className="text-xs text-slate-500">{req.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.required && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Required</Badge>}
                    {req.uploaded ? (
                      <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">Uploaded</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="border-teal-500/50 text-teal-400 text-xs h-7">Upload</Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className={`p-4 md:p-6 space-y-6 ${isLight ? "bg-slate-50 text-slate-900" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Vendor & Supplier Management
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            Vendor scorecards, procurement workflows, compliance tracking, and spend analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/bulk-upload?type=contacts")} className="gap-1.5">
          <Upload className="w-4 h-4" /> Bulk Import
        </Button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 overflow-x-auto pb-1 border-b ${isLight ? "border-slate-200" : "border-slate-700/50"}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-teal-500/10 text-teal-400 border-b-2 border-teal-400"
                : isLight
                  ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "directory" && renderDirectory()}
      {activeTab === "scorecards" && renderScorecards()}
      {activeTab === "purchase-orders" && renderPurchaseOrders()}
      {activeTab === "rfq" && renderRfq()}
      {activeTab === "spend" && renderSpendAnalytics()}
      {activeTab === "compliance" && renderCompliance()}
      {activeTab === "onboarding" && renderOnboarding()}
    </div>
  );
}
